/*
Name: CustomClaimAffectedObjectForm
Author: Global
Description: Carga en modo consulta los datos del objeto asegurado de la poliza para un reclamo.
Category: FORM
Version: 1.00
CreateDate: 28-09-2026
*/

var me = this;

(function () {
  var policyId = Number(context && context.policyId);
  var formId = Number(context && context.formId);
  var lob = String(context && context.lob || '');
  var OBJECT_CODES = {
    '1': ['DT_INCENDIO_V3', 'DTINCENDIO_SUMA'],
    '81': ['OBJFIANZA'], '82': ['OBJFIANZA'], '83': ['OBJFIANZA'], '84': ['OBJFIANZA'],
    '31': ['DT_ACCIDENTES_V1'], '20': ['DT_ACCIDENTES_V1'], '71': ['DT_ACCIDENTES_V1']
  };
  var FIELD_ALIASES = {
    ownerName: ['ownerName'],
    ownerIdNumber: ['ownerIdNumber'],
    countryCode: ['countryCode', 'cmbPais'],
    provinceCode: ['provinceCode', 'cmbProvincia'],
    cityCode: ['cityCode', 'cmbMunicipio'],
    corregimientoCode: ['corregimientoCode', 'cmbSector'],
    description: ['description', 'Descripcion', 'descripcion']
  };

  function message($form, text, type) {
    $form.find('.claim-affected-object-status').remove();
    $('<div class="claim-affected-object-status alert alert-' + type + '"></div>')
      .text(text).prependTo($form);
  }

  function valuesFromObject(insuredObject) {
    var direct = insuredObject && insuredObject.userData;
    var fields = [];
    try { fields = JSON.parse(insuredObject && insuredObject.jValues || '[]'); } catch (error) {}
    var values = {};
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      Object.keys(direct).forEach(function (name) {
        values[name] = Array.isArray(direct[name]) ? direct[name].slice() : [direct[name]];
      });
    }
    if (!Array.isArray(fields)) return values;
    return fields.reduce(function (result, field) {
      if (field && typeof field.name === 'string' && Array.isArray(field.userData)) {
        result[field.name] = field.userData.slice();
      }
      return result;
    }, values);
  }

  function applyValues($form, values, labels) {
    $form.find('[name]').each(function () {
      var $control = $(this);
      var names = FIELD_ALIASES[$control.attr('name')] || [$control.attr('name')];
      var stored = names.reduce(function (result, name) {
        if (result !== null && result !== undefined) return result;
        return values[name];
      }, null);
      if (!stored || !stored.length) return;
      var value = stored[0] == null ? '' : String(stored[0]);
      if ($control.is(':checkbox,:radio')) {
        $control.prop('checked', stored.map(String).indexOf(String($control.val())) >= 0 || stored.map(String).indexOf('true') >= 0);
      } else {
        var $option = $control.is('select') ? $control.find('option').filter(function () { return String($(this).val()) === value; }) : $();
        if ($control.is('select') && !$option.length) {
          $option = $('<option></option>').val(value).text(labels && labels[$control.attr('name')] || value).appendTo($control);
        }
        if ($option.length && labels && labels[$control.attr('name')]) {
          $option.text(labels[$control.attr('name')]);
        }
        $control.val(value).attr('user-data', value);
      }
      $control.trigger('input').trigger('change');
    });
  }

  function setControlValue($form, name, value) {
    var $control = $form.find('[name="' + name + '"]');
    if (!$control.length || value === null || value === undefined || value === '') return;
    $control.val(String(value)).attr('user-data', String(value)).trigger('input').trigger('change');
  }

  function catalogCode(row) {
    return row && (row.code !== undefined ? row.code : row.id !== undefined ? row.id : row.value);
  }

  function catalogName(row) {
    return row && (row.name || row.description || row.label || row.text || catalogCode(row));
  }

  function loadCatalog(command, filter) {
    return me.exe(command, { operation: 'GET', filter: filter }).then(function (result) {
      return Array.isArray(result && result.outData) ? result.outData : [];
    });
  }

  function labelFrom(rows, value) {
    var match = rows.find(function (row) { return String(catalogCode(row)) === String(value); });
    return match ? String(catalogName(match)) : String(value || '');
  }

  function loadCatalogLabels($form) {
    var country = $form.find('[name="countryCode"]').val();
    var province = $form.find('[name="provinceCode"]').val();
    var city = $form.find('[name="cityCode"]').val();
    var labels = {};
    if (!country) return Promise.resolve(labels);
    return loadCatalog('RepoCountryCatalog', "[code]='" + country + "'").then(function (countries) {
      labels.countryCode = labelFrom(countries, country);
      return loadCatalog('RepoStateCatalog', "[countryCode]='" + country + "'");
    }).then(function (states) {
      labels.provinceCode = labelFrom(states, province);
      if (!province) return [];
      return loadCatalog('RepoCityCatalog', "[stateCode]='" + province + "'");
    }).then(function (cities) {
      labels.cityCode = labelFrom(cities, city);
      if (!city) return [];
      return loadCatalog('RepoSectorCatalog', "[cityCode]='" + city + "'");
    }).then(function (sectors) {
      labels.corregimientoCode = labelFrom(sectors, $form.find('[name="corregimientoCode"]').val());
      return labels;
    });
  }

  function contactName(contact) {
    if (!contact) return '';
    if (contact.FullName || contact.fullName || contact.name) return String(contact.FullName || contact.fullName || contact.name).trim();
    return [contact.firstName, contact.middleName, contact.surname1, contact.surname2].filter(Boolean).join(' ').trim();
  }

  function contactIdentity(contact) {
    if (!contact) return '';
    if (contact.idType === 'PAS' && contact.passport) return contact.passport;
    if (contact.isPerson === false && contact.nif) return contact.nif;
    return contact.cnp || contact.nif || contact.passport || contact.nationalId || contact.identification || '';
  }

  function policyInsured(policy) {
    var insured = policy && Array.isArray(policy.Insureds) ? policy.Insureds.find(Boolean) : null;
    return insured && (insured.Contact || insured.contact || insured);
  }

  function policyInsuredContactId(policy) {
    var insured = policy && Array.isArray(policy.Insureds) ? policy.Insureds.find(Boolean) : null;
    return Number(insured && (insured.contactId || insured.Contact && insured.Contact.id || insured.contact && insured.contact.id));
  }

  function loadPolicyInsured() {
    return me.exe('RepoLifePolicy', {
      operation: 'GET', include: ['Insureds'], filter: 'id=' + policyId, noTracking: true
    }).then(function (result) {
      var policy = result && result.outData && result.outData[0] || {};
      var contact = policyInsured(policy);
      var contactId = policyInsuredContactId(policy);
      if (contactName(contact) && contactIdentity(contact) || !Number.isSafeInteger(contactId) || contactId <= 0) return contact || {};
      return me.exe('GetContacts', { filter: 'id=' + contactId, size: 1 })
        .then(function (contacts) { return contacts && contacts.outData && contacts.outData[0] || contact; })
        .catch(function () { return contact; });
    });
  }

  function lockFields($form) {
    $form.find('input,textarea').not('[type="hidden"]').prop('readonly', true).attr('aria-readonly', 'true');
    $form.find('select,button').prop('disabled', true).attr('aria-disabled', 'true');
  }

  function selectObject(rows) {
    var objects = Array.isArray(rows) ? rows.filter(function (row) { return row && row.jValues; }) : [];
    if (!objects.length) return null;
    var codes = OBJECT_CODES[lob] || [];
    var byCode = objects.find(function (row) {
      return codes.indexOf(String(row.ObjectDefinition && row.ObjectDefinition.code || '').toUpperCase()) >= 0;
    });
    return byCode || objects.find(function (row) {
      return Number(row.ObjectDefinition && row.ObjectDefinition.formId) === formId;
    }) || null;
  }

  function initialize() {
    var $form = $('.rendered-form').first();
    if (!$form.length) $form = $('form').first();
    if (!$form.length) return;
    if (!Number.isSafeInteger(policyId) || policyId <= 0) {
      message($form, 'No se recibio una poliza valida para cargar el objeto asegurado.', 'warning');
      lockFields($form);
      return;
    }
    message($form, 'Cargando datos del objeto asegurado...', 'info');
    var objectRequest = me.exe('RepoInsuredObject', {
      operation: 'GET', filter: 'lifePolicyId=' + policyId, include: ['ObjectDefinition'], size: 100
    });
    Promise.all([objectRequest, loadPolicyInsured()]).then(function (results) {
      var insuredObject = selectObject(results[0] && results[0].outData);
      if (!insuredObject) {
        message($form, 'La poliza no tiene un objeto asegurado compatible con el ramo.', 'warning');
        lockFields($form);
        return;
      }
      var values = valuesFromObject(insuredObject);
      applyValues($form, values);
      setControlValue($form, 'ownerName', contactName(results[1]));
      setControlValue($form, 'ownerIdNumber', contactIdentity(results[1]));
      return loadCatalogLabels($form).catch(function () { return {}; }).then(function (labels) {
        applyValues($form, values, labels);
        lockFields($form);
        $form.find('.claim-affected-object-status').remove();
      });
    }).catch(function () {
      message($form, 'No fue posible cargar los datos del objeto asegurado.', 'danger');
      lockFields($form);
    });
  }

  initialize();
})();
