/**
 * Configuration for aspect layout and grouping
 * Maps aspect names to UI configuration
 */
const aspectLayoutConfig = {
  'Game': { group: 'Basic Info', order: 1 },
  'Card Name': { group: 'Basic Info', order: 2 },
  'Set': { group: 'Basic Info', order: 3 },
  'Card Number': { group: 'Basic Info', order: 4 },
  'Graded': { group: 'Condition', order: 1 },
  'Professional Grader': { group: 'Condition', order: 2 },
  'Grade': { group: 'Condition', order: 3 },
  'Certification Number': { group: 'Condition', order: 4 },
  'Card Type': { group: 'Details', order: 1 },
  'Character': { group: 'Details', order: 2 },
  'Creature/Monster Type': { group: 'Details', order: 3 },
  'Card Condition': { group: 'Condition', order: 5 },
  'Language': { group: 'Details', order: 4 },
  'Finish': { group: 'Details', order: 5 },
  'Year Manufactured': { group: 'Details', order: 6 },
  'Autographed': { group: 'Advanced', order: 1 },
  'Autograph Authentication': { group: 'Advanced', order: 2 },
  'Autograph Authentication Number': { group: 'Advanced', order: 3 },
  'Autograph Format': { group: 'Advanced', order: 4 },
  'Manufacturer': { group: 'Advanced', order: 5 },
  'Material': { group: 'Advanced', order: 6 },
  'Vintage': { group: 'Advanced', order: 7 },
}

/**
 * Maps raw eBay aspects array to UI-friendly field configurations
 * @param {Array} aspects - Array of aspect objects from eBay aspects JSON
 * @returns {Array} Array of field configuration objects
 */
export function mapEbayAspectsToFields(aspects) {
  if (!Array.isArray(aspects)) {
    return []
  }

  return aspects.map(aspect => {
    const {
      localizedAspectName,
      aspectConstraint,
      aspectValues = []
    } = aspect

    const {
      aspectDataType = 'STRING',
      itemToAspectCardinality = 'SINGLE',
      aspectMode = 'FREE_TEXT',
      aspectRequired = false,
      aspectUsage = 'OPTIONAL',
      aspectEnabledForVariations = false,
      aspectApplicableTo = [],
      aspectFormat
    } = aspectConstraint || {}

    // Determine field type based on constraints
    let fieldType = 'text'
    
    if (aspectMode === 'SELECTION_ONLY') {
      fieldType = itemToAspectCardinality === 'MULTI' ? 'multi-select' : 'select'
    } else if (aspectDataType === 'NUMBER') {
      fieldType = 'number'
    } else if (aspectMode === 'FREE_TEXT') {
      fieldType = itemToAspectCardinality === 'MULTI' ? 'multi-select' : 'text'
    }

    // Extract options from aspectValues
    const options = aspectValues.map(val => val.localizedValue)

    // Build conditional options map
    const conditionalOptions = {}
    aspectValues.forEach(val => {
      if (val.valueConstraints && Array.isArray(val.valueConstraints)) {
        conditionalOptions[val.localizedValue] = val.valueConstraints.map(constraint => ({
          dependsOn: constraint.applicableForLocalizedAspectName,
          values: constraint.applicableForLocalizedAspectValues || []
        }))
      }
    })

    // Get layout config or use defaults
    const layoutConfig = aspectLayoutConfig[localizedAspectName] || {
      group: 'Other',
      order: 999
    }

    return {
      aspectName: localizedAspectName,
      dataType: aspectDataType,
      cardinality: itemToAspectCardinality,
      required: aspectRequired,
      mode: aspectMode,
      usage: aspectUsage,
      enabledForVariations: aspectEnabledForVariations,
      applicableTo: aspectApplicableTo,
      format: aspectFormat,
      options,
      conditionalOptions,
      ui: {
        fieldType,
        group: layoutConfig.group,
        order: layoutConfig.order,
        hidden: false
      }
    }
  })
}

/**
 * Gets visible options for a field based on current aspect values and constraints
 * @param {Object} field - Field configuration object
 * @param {Object} aspectValues - Current aspect values keyed by aspect name
 * @returns {Array} Array of visible option strings
 */
export function getVisibleOptions(field, aspectValues) {
  if (!field || !field.options || field.options.length === 0) {
    return []
  }

  // If no conditional options, all options are visible
  if (!field.conditionalOptions || Object.keys(field.conditionalOptions).length === 0) {
    return field.options
  }

  return field.options.filter(optionValue => {
    const constraints = field.conditionalOptions[optionValue]
    
    // No constraints means it's always visible
    if (!constraints || constraints.length === 0) {
      return true
    }

    // All constraints must be satisfied
    return constraints.every(constraint => {
      const dependentValue = aspectValues[constraint.dependsOn]
      
      // If dependent field is not set, constraint is not satisfied
      if (!dependentValue) {
        return false
      }

      // Check if dependent value matches any of the allowed values
      if (Array.isArray(dependentValue)) {
        // Multi-select: at least one value must match
        return dependentValue.some(val => constraint.values.includes(val))
      } else {
        // Single value: must match one of the allowed values
        return constraint.values.includes(dependentValue)
      }
    })
  })
}

/**
 * Validates aspect values against field constraints
 * @param {Array} fields - Array of field configurations
 * @param {Object} aspectValues - Current aspect values
 * @returns {Array} Array of validation error messages
 */
export function validateAspectValues(fields, aspectValues) {
  const errors = []

  fields.forEach(field => {
    const value = aspectValues[field.aspectName]

    // Check required fields
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push(`${field.aspectName} is required`)
      return
    }

    // Skip validation if no value provided and not required
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return
    }

    // Validate cardinality
    if (field.cardinality === 'SINGLE' && Array.isArray(value)) {
      errors.push(`${field.aspectName} can only have one value`)
      return
    }

    if (field.cardinality === 'MULTI' && !Array.isArray(value)) {
      errors.push(`${field.aspectName} must be an array`)
      return
    }

    // Validate data type
    if (field.dataType === 'NUMBER') {
      const valuesToCheck = Array.isArray(value) ? value : [value]
      valuesToCheck.forEach(val => {
        if (isNaN(Number(val))) {
          errors.push(`${field.aspectName} must be a number`)
        }
      })
    }

    // Validate selection mode
    if (field.mode === 'SELECTION_ONLY') {
      const visibleOptions = getVisibleOptions(field, aspectValues)
      const valuesToCheck = Array.isArray(value) ? value : [value]
      
      valuesToCheck.forEach(val => {
        if (!visibleOptions.includes(val)) {
          errors.push(`${field.aspectName}: "${val}" is not a valid option`)
        }
      })
    }
  })

  return errors
}

/**
 * Groups fields by their UI group property
 * @param {Array} fields - Array of field configurations
 * @returns {Object} Fields grouped by group name
 */
export function groupFieldsByCategory(fields) {
  const grouped = {}
  
  fields.forEach(field => {
    const groupName = field.ui.group || 'Other'
    if (!grouped[groupName]) {
      grouped[groupName] = []
    }
    grouped[groupName].push(field)
  })

  // Sort fields within each group by order
  Object.keys(grouped).forEach(groupName => {
    grouped[groupName].sort((a, b) => a.ui.order - b.ui.order)
  })

  return grouped
}

