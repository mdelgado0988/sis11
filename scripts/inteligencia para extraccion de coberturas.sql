use sis11
go

dame en este formato: 
- name: Muerte por Cualquier Causa
	code: '20'
	basic: true
	mandatory: true
	limit: _quoteParams.find(x => x.code == "20")?.limit || 0
	premium: _quoteParams.find(x => x.code == "20")?.premium || 0
	deductible: _quoteParams.find(x => x.code == "20")?.dedutible || 0
	insurability: false
	start: _pol.start
	end: 'addYears(_pol.start,1)'
	commercialName: BASICO
	appliesTo: INS
	number: 1
	restrictUserEdition: false
	minLimit: -1
	maxLimit: -1
	minPremium: 0
	claimType: DTH
	description: Muerte por Cualquier Causa,
mapeo de datos:
name: cobertura,
basic: cuando bobligatoria = O
mandatory: cuando bobligatoria = O
commercialName: xdescripcion_c
number: autoincrementable
description: cobertura
