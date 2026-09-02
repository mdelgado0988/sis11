/**
 * @name frmACH
 * @description Loads bank contacts into cmbBancoACH for ACH configuration.
 * @type FORM
 * @author Michael Delgado
 * @created 2026/09/02
 * @version 1.0
 * @purpose Populate the bank selector with active contacts assigned the BNK role.
 */

var me = this;

(function initializeACHBankSelector() {
    var cacheKey = '__frmACHBankContacts';
    var observerKey = '__frmACHBankContactsObserver';
    var cache = window[cacheKey] || {
        promise: null,
        options: [],
        loaded: false
    };

    window[cacheKey] = cache;

    function getBankSelector() {
        return $('#cmbBancoACH');
    }

    function getBankRouteField() {
        return $('#txtRutaACH');
    }

    function getBankAccountField() {
        return $('#txtNoCuentaACH');
    }

    function lockBankRouteField() {
        getBankRouteField().prop('readonly', true);
        getBankAccountField().prop('readonly', true);
    }

    function getBankFieldContainer() {
        var selector = getBankSelector();
        var container = selector.closest('.form-group, .form-field, .field, .control, .col-md-12, .col-md-6').first();
        return container.length ? container : selector.parent();
    }

    function showBankLoadingMask() {
        var selector = getBankSelector();
        var container = getBankFieldContainer();
        if (!selector.length || !container.length) return;

        container.css('position', 'relative');
        container.find('.frm-ach-bank-loading-mask').remove();

        $('<div>', {
            class: 'frm-ach-bank-loading-mask',
            text: 'Procesando...'
        }).css({
            position: 'absolute',
            top: selector.position().top,
            left: selector.position().left,
            width: selector.outerWidth(),
            height: selector.outerHeight(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.82)',
            color: '#595959',
            fontSize: '12px',
            zIndex: 2,
            pointerEvents: 'none'
        }).appendTo(container);
    }

    function hideBankLoadingMask() {
        getBankFieldContainer().find('.frm-ach-bank-loading-mask').remove();
    }

    function parseJson(value) {
        if (typeof value !== 'string') return value;
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function getRutaBanco(customForms) {
        debugger;
        var forms = parseJson(customForms);
        var companyForm = forms && forms['Información de Compañías'];
        if (!companyForm) {
            return { value: null, reason: 'El contacto no tiene el formulario Información de Compañías.' };
        }

        var fields = parseJson(companyForm);
        if (!Array.isArray(fields)) {
            return { value: null, reason: 'El formulario Información de Compañías no tiene un formato válido.' };
        }

        var routeField = fields.find(function (field) {
            return field && field.name === 'rutaBanco';
        });
        if (!routeField) {
            return { value: null, reason: 'El campo rutaBanco no existe en Información de Compañías.' };
        }

        var userData = Array.isArray(routeField.userData) ? routeField.userData[0] : routeField.userData;
        if (userData === null || userData === undefined || String(userData).trim() === '') {
            return { value: null, reason: 'El campo rutaBanco no tiene información.' };
        }

        return { value: String(userData).trim(), reason: null };
    }

    async function loadSelectedBankData() {
        var selector = getBankSelector();
        var contactId = selector.val();
        if (!contactId) {
            window.frmACHBankData = null;
            getBankRouteField().val('');
            return null;
        }

        var response = await me.exe('LoadEntity', {
            entity: 'Contact',
            fields: 'jCustomForms',
            filter: 'id = ' + Number(contactId)
        });

        if (!response || response.ok === false || !response.outData) {
            throw new Error(response && response.msg ? response.msg : 'No se pudo cargar la información del banco.');
        }

        var route = getRutaBanco(response.outData.jCustomForms);
        if (!route.value) {
            window.frmACHBankData = {
                contactId: Number(contactId),
                rutaBanco: null,
                valid: false
            };
            selector.attr('data-ruta-banco', '');
            getBankRouteField().val('');
            console.warn('frmACH: ' + route.reason);
            return window.frmACHBankData;
        }

        window.frmACHBankData = {
            contactId: Number(contactId),
            rutaBanco: route.value,
            valid: true
        };
        selector.attr('data-ruta-banco', route.value);
        getBankRouteField().val(route.value);
        return window.frmACHBankData;
    }

    function bindBankSelection() {
        getBankSelector()
            .off('change.frmACH')
                .on('change.frmACH', function () {
                    loadSelectedBankData().catch(function (error) {
                        window.frmACHBankData = null;
                        $(this).attr('data-ruta-banco', '');
                        getBankRouteField().val('');
                        console.error('Error loading selected bank data:', error);
                    }.bind(this));
                });
    }

    function getContactName(contact) {
        return [
            contact && contact.name,
            contact && contact.middlename,
            contact && contact.surname1,
            contact && contact.surname2,
            contact && contact.companyName,
            contact && contact.businessName
        ]
            .map(function (value) { return String(value == null ? '' : value).trim(); })
            .filter(Boolean)
            .join(' ') || String(contact && (contact.description || contact.id) || '').trim();
    }

    function getRows(response) {
        if (!response) return [];
        if (Array.isArray(response.outData)) return response.outData;
        if (Array.isArray(response.data)) return response.data;
        return Array.isArray(response) ? response : [];
    }

    function populateBankSelector(options) {
        var selector = getBankSelector();
        if (!selector.length || !Array.isArray(options)) return;

        var selectedValue = selector.val() || selector.attr('user-data') || '';
        var signature = options.map(function (option) {
            return option.value + ':' + option.label;
        }).join('|');

        if (selector.attr('data-bnk-loaded') === signature) return;

        selector.empty().append($('<option>', {
            value: '',
            text: 'Seleccione una opción'
        }));

        options.forEach(function (option) {
            $('<option>', {
                value: option.value,
                text: option.label
            }).appendTo(selector);
        });

        if (selectedValue) selector.val(String(selectedValue));
        selector.attr('data-bnk-loaded', signature);
        bindBankSelection();
    }

    function loadBankContacts() {
        if (cache.promise) return cache.promise;
        if (cache.loaded) {
            populateBankSelector(cache.options);
            return Promise.resolve(cache.options);
        }

        showBankLoadingMask();
        cache.promise = me.exe('GetContacts', {
            operation: 'GET',
            filter: "inactive = 0 AND exists (select 1 from contactRole r where r.contactId = contact.id and r.role = 'BNK')"
        }).then(function (response) {
            if (!response || response.ok === false) {
                throw new Error(response && response.msg ? response.msg : 'Banks could not be loaded.');
            }

            var seen = {};
            cache.options = getRows(response).map(function (contact) {
                var id = contact && contact.id != null ? String(contact.id) : '';
                var label = getContactName(contact);
                if (!id || !label || seen[id]) return null;
                seen[id] = true;
                return { value: id, label: label };
            }).filter(Boolean);
            cache.loaded = true;
            populateBankSelector(cache.options);
            return cache.options;
        }).catch(function (error) {
            cache.promise = null;
            console.error('Error loading BNK bank contacts:', error);
            return [];
        }).then(function (options) {
            hideBankLoadingMask();
            return options;
        });

        return cache.promise;
    }

    function ensureBankSelector() {
        lockBankRouteField();
        if (cache.loaded) {
            populateBankSelector(cache.options);
            bindBankSelection();
        } else {
            loadBankContacts();
        }
    }

    // DTINCENDIO_V3 loads its initial catalogs after the document is ready.
    // Keep the same timing so the form controls already exist before filling them.
    function onDocumentReady() {
        ensureBankSelector();
    }

    $(document).promise().then(function () {
        setTimeout(onDocumentReady, 1000);
    });

    if (window[observerKey] && typeof window[observerKey].disconnect === 'function') {
        window[observerKey].disconnect();
    }

    if (typeof MutationObserver !== 'undefined') {
        window[observerKey] = new MutationObserver(function () {
            if (getBankSelector().length) ensureBankSelector();
        });
        window[observerKey].observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
