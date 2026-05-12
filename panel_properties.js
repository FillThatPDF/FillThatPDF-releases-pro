function openPropertiesModal(field) {
    // Auto-save previous field if panel was already open with a different field
    const panel = document.getElementById('propertiesModal');
    if (panel.style.display === 'flex' && modalField && modalField !== field && !isMultiFieldEdit) {
        savePropertiesModalSilent();
    }

    modalField = field;
    modalOriginalRect = [...field.rect];
    isMultiFieldEdit = false;
    // Show field name in title for quick reference
    const displayName = field.name.length > 30 ? field.name.substring(0, 27) + '...' : field.name;
    document.getElementById('modalTitle').textContent = `📋 ${displayName}`;

    // Show all tabs
    document.querySelectorAll('.modal-tab').forEach(tab => tab.style.display = 'block');
    // Only switch tab if panel is first opening (keep current tab on field switch)
    if (panel.style.display !== 'flex') {
        switchPropertiesTab('general');
    }

    panel.style.display = 'flex';
    panel.classList.remove('minimized');
    
    // Populate form
    // General tab
    document.getElementById('modalPropName').value = field.name;
    document.getElementById('modalPropTooltip').value = field.tooltip || '';
    document.getElementById('modalPropType').value = field.type;
    document.getElementById('modalPropPage').value = field.page + 1;

    // v1.1.0: Radio group name row in General tab
    const modalGroupRow = document.getElementById('modalPropRadioGroupRow');
    const modalGroupInput = document.getElementById('modalPropRadioGroup');
    if (modalGroupRow && modalGroupInput) {
        if (field.type === 'radio') {
            modalGroupRow.style.display = 'block';
            modalGroupInput.value = field.radio_group || '';
        } else {
            modalGroupRow.style.display = 'none';
            modalGroupInput.value = '';
        }
    }
    document.getElementById('modalPropVisibility').value = field.visibility || 'visible';
    document.getElementById('modalPropOrientation').value = field.orientation || 0;
    document.getElementById('modalPropReadOnly').checked = field.readOnly || false;
    document.getElementById('modalPropRequired').checked = field.required || false;
    document.getElementById('modalPropLocked').checked = field.locked || false;
    
    // Appearance tab - check edited style, then extracted values, then global defaults
    // Border color: check for empty string (transparent) before falling through to defaults
    const modalExtractedBorder = field.border_color ?? field.borderColor;
    const modalStyledBorder = field.style?.borderColor;
    let modalBorderValue;
    if (modalStyledBorder !== undefined) {
        modalBorderValue = modalStyledBorder;
    } else if (modalExtractedBorder === '' || modalExtractedBorder === 'transparent') {
        modalBorderValue = 'transparent';
    } else if (modalExtractedBorder) {
        modalBorderValue = modalExtractedBorder;
    } else {
        modalBorderValue = windowGlobalSettings?.borderColor || '#000000';
    }
    updateColorSwatch('modalPropBorderColor', modalBorderValue);
    // Fill color: check for empty string (transparent) before falling through to defaults.
    // When extraction returned no fill at all (null/undefined) AND the user has
    // never set a style, assume transparent rather than inventing a white fill
    // the field never actually had.
    const modalExtractedFill = field.fill_color ?? field.fillColor;
    const modalStyledFill = field.style?.fillColor;
    let modalFillValue;
    if (modalStyledFill !== undefined) {
        modalFillValue = modalStyledFill;
    } else if (modalExtractedFill === '' || modalExtractedFill === 'transparent' || modalExtractedFill == null) {
        modalFillValue = 'transparent';
    } else {
        modalFillValue = modalExtractedFill;
    }
    updateColorSwatch('modalPropFillColor', modalFillValue);
    document.getElementById('modalPropLineThickness').value = field.style?.lineThickness ?? field.lineThickness ?? windowGlobalSettings?.borderThickness ?? '1';
    document.getElementById('modalPropLineStyle').value = field.style?.lineStyle || field.lineStyle || windowGlobalSettings?.borderStyle || 'solid';
    document.getElementById('modalPropFontSize').value = field.style?.fontSize || field.font_size || field.fontSize || windowGlobalSettings?.fontSize || 9;
    updateColorSwatch('modalPropTextColor', field.style?.fontColor || field.text_color || field.fontColor || windowGlobalSettings?.fontColor || '#000000');
    document.getElementById('modalPropFont').value = field.style?.fontFamily || field.font_family || field.fontFamily || windowGlobalSettings?.fontFamily || 'Helvetica';
    
    // Options tab
    const checkboxStyleGroup = document.getElementById('modalPropCheckboxStyleGroup');
    if (checkboxStyleGroup) {
        if (field.type === 'checkbox' || field.type === 'radio') {
            checkboxStyleGroup.style.display = 'block';
            const cbStyleInput = document.getElementById('modalPropCheckboxStyle');
            if (cbStyleInput) {
                const globalDefault = windowGlobalSettings?.checkboxStyle || 'check';
                cbStyleInput.value = field.style?.checkboxStyle || field.checkboxStyle || globalDefault;
            }
        } else {
            checkboxStyleGroup.style.display = 'none';
        }
    }
    
    // Position tab - set to points initially
    document.getElementById('modalPropUnits').value = 'pt';
    updatePositionDisplay();
    
    // Options tab - check edited style, then extracted values
    document.getElementById('modalPropAlignment').value = field.style?.textAlign || field.text_align || field.textAlign || 'left';
    
    // Dropdown options group
    const dropdownOptionsGroup = document.getElementById('modalDropdownOptionsGroup');
    const textOptionsGroup = document.getElementById('modalPropTextOptionsGroup');
    if (field.type === 'combobox' || field.type === 'listbox') {
        if (dropdownOptionsGroup) dropdownOptionsGroup.style.display = 'block';
        if (textOptionsGroup) textOptionsGroup.style.display = 'none';
        
        // Populate flags
        document.getElementById('modalPropDropdownSort').checked = !!(field.style?.sort ?? field.sort);
        document.getElementById('modalPropDropdownEditable').checked = !!(field.style?.editable ?? field.editable);
        document.getElementById('modalPropDropdownSpellCheck').checked = !!(field.style?.spellCheck ?? field.spellCheck ?? true);
        document.getElementById('modalPropDropdownCommit').checked = !!(field.style?.commitImmediately ?? field.commitImmediately);
        
        // Render options list
        field._selectedOptionIdx = -1; // Reset selection
        renderChoiceList(field, 'modalPropDropdownList', 'modalProp');
    } else {
        if (dropdownOptionsGroup) dropdownOptionsGroup.style.display = 'none';
        if (textOptionsGroup) textOptionsGroup.style.display = 'block';
    }

    // Validation tab
    const styled = changes.styled[field.name] || {};
    const validation = styled.validation || field.validation || {};
    
    // Default value
    document.getElementById('modalPropDefaultValue').value = validation.defaultValue || '';
    
    // Text options
    document.getElementById('modalPropMultiline').checked = field.style?.multiline ?? field.multiline ?? false;
    document.getElementById('modalPropScrollText').checked = field.style?.scrollText ?? field.scrollable ?? true;
    document.getElementById('modalPropPassword').checked = field.style?.password ?? field.password ?? false;
    document.getElementById('modalPropMaxLen').value = field.style?.maxLen ?? field.maxLen ?? '';
    document.getElementById('modalPropComb').checked = field.style?.comb ?? field.comb ?? false;
    
    // Format tab - use formatType if available, else detect from specific properties
    let formatCategory = 'none';
    if (field.formatType || field.style?.formatType) {
        formatCategory = field.formatType || field.style?.formatType;
    } else if (field.dateFormat || field.style?.dateFormat) {
        formatCategory = 'date';
    } else if (field.currencySymbol !== undefined || field.style?.currencySymbol !== undefined) {
        formatCategory = 'currency';
    } else if (field.phoneFormat || field.style?.phoneFormat) {
        formatCategory = 'phone';
    } else if (field.numberDecimals !== undefined || field.style?.numberDecimals !== undefined) {
        formatCategory = 'number';
    } else if (field.zipFormat || field.style?.zipFormat) {
        formatCategory = 'zip';
    }
    
    document.getElementById('modalFormatCategory').value = formatCategory;
    updateFormatOptions();
    
    // Set format-specific values
    if (formatCategory === 'date') {
        document.getElementById('modalDateFormat').value = field.style?.dateFormat || field.dateFormat || 'MM/DD/YYYY';
    } else if (formatCategory === 'currency') {
        document.getElementById('modalCurrencySymbol').value = field.style?.currencySymbol ?? field.currencySymbol ?? '$';
        document.getElementById('modalCurrencyDecimals').value = field.style?.currencyDecimals ?? field.currencyDecimals ?? 2;
        document.getElementById('modalSymbolLocation').value = field.style?.symbolLocation || field.symbolLocation || 'before-space';
    } else if (formatCategory === 'phone') {
        document.getElementById('modalPhoneFormat').value = field.style?.phoneFormat || field.phoneFormat || '(XXX) XXX-XXXX';
    } else if (formatCategory === 'number') {
        document.getElementById('modalNumberDecimals').value = field.style?.numberDecimals ?? field.numberDecimals ?? 2;
        document.getElementById('modalNumberSeparator').value = field.style?.thousandSep ?? field.thousandSep ?? ',';
    } else if (formatCategory === 'zip') {
        document.getElementById('modalZipFormat').value = field.style?.zipFormat || field.zipFormat || 'XXXXX';
    }
    
    // Reset dirty flags after populating — user hasn't changed anything yet
    formatDirty = false;
    fontDirty = false;

    // Only switch to General tab if panel is first opening (keep current tab on field switch)
    if (panel.style.display !== 'flex') {
        switchPropertiesTab('general');
    }
}


function openMultiFieldPropertiesModal(fields) {
    isMultiFieldEdit = true;
    multiFieldSelection = fields;
    
    // Use first field as proxy for form
    modalField = fields[0];
    modalOriginalRect = [...modalField.rect];
    
    const panel = document.getElementById('propertiesModal');
    panel.style.display = 'flex';
    panel.classList.remove('minimized');
    document.getElementById('modalTitle').textContent = `Properties (${fields.length} selected)`;

    // Hide tabs not applicable to multi-select (keep Appearance, Options, Format, Calculate)
    document.querySelectorAll('.modal-tab').forEach(tab => {
        const tabName = tab.dataset.tab;
        if (tabName === 'appearance' || tabName === 'options' || tabName === 'format' || tabName === 'calculate') {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });

    // Switch to Appearance tab
    switchPropertiesTab('appearance');
    
    // Appearance tab - check edited style, then extracted values, then global defaults
    // Border color: check for empty string (transparent) before falling through to defaults
    const batchExtractedBorder = modalField.border_color ?? modalField.borderColor;
    const batchStyledBorder = modalField.style?.borderColor;
    let batchBorderValue;
    if (batchStyledBorder !== undefined) {
        batchBorderValue = batchStyledBorder;
    } else if (batchExtractedBorder === '' || batchExtractedBorder === 'transparent') {
        batchBorderValue = 'transparent';
    } else if (batchExtractedBorder) {
        batchBorderValue = batchExtractedBorder;
    } else {
        batchBorderValue = windowGlobalSettings?.borderColor || '#000000';
    }
    updateColorSwatch('modalPropBorderColor', batchBorderValue);
    // Fill color: check for empty string (transparent) before falling through to defaults.
    // Default to transparent when extraction found nothing — matches single-field logic.
    const batchExtractedFill = modalField.fill_color ?? modalField.fillColor;
    const batchStyledFill = modalField.style?.fillColor;
    let batchFillValue;
    if (batchStyledFill !== undefined) {
        batchFillValue = batchStyledFill;
    } else if (batchExtractedFill === '' || batchExtractedFill === 'transparent' || batchExtractedFill == null) {
        batchFillValue = 'transparent';
    } else {
        batchFillValue = batchExtractedFill;
    }
    updateColorSwatch('modalPropFillColor', batchFillValue);
    document.getElementById('modalPropLineThickness').value = modalField.style?.lineThickness ?? modalField.lineThickness ?? windowGlobalSettings?.borderThickness ?? '1';
    document.getElementById('modalPropLineStyle').value = modalField.style?.lineStyle || modalField.lineStyle || windowGlobalSettings?.borderStyle || 'solid';
    document.getElementById('modalPropFontSize').value = modalField.style?.fontSize || modalField.font_size || modalField.fontSize || windowGlobalSettings?.fontSize || 9;
    updateColorSwatch('modalPropTextColor', modalField.style?.fontColor || modalField.text_color || modalField.fontColor || windowGlobalSettings?.fontColor || '#000000');
    document.getElementById('modalPropFont').value = modalField.style?.fontFamily || modalField.font_family || modalField.fontFamily || windowGlobalSettings?.fontFamily || 'Helvetica';
    
    // Options tab (Checkbox style for multi-selection)
    const checkboxStyleGroup = document.getElementById('modalPropCheckboxStyleGroup');
    if (checkboxStyleGroup) {
        const hasCheckboxes = fields.some(f => f.type === 'checkbox' || f.type === 'radio');
        checkboxStyleGroup.style.display = hasCheckboxes ? 'block' : 'none';
        if (hasCheckboxes) {
            const globalDefault = windowGlobalSettings?.checkboxStyle || 'check';
            document.getElementById('modalPropCheckboxStyle').value = modalField.style?.checkboxStyle || modalField.checkboxStyle || globalDefault;
        }
    }
    
    // Options tab - check edited style, then extracted values
    document.getElementById('modalPropAlignment').value = modalField.style?.textAlign || modalField.text_align || modalField.textAlign || 'left';
    document.getElementById('modalPropMultiline').checked = modalField.multiline || false;
    document.getElementById('modalPropScrollText').checked = modalField.scrollable || true;
    document.getElementById('modalPropPassword').checked = modalField.password || false;
    document.getElementById('modalPropMaxLen').value = modalField.maxLen || '';
    document.getElementById('modalPropComb').checked = modalField.comb || false;
    
    // Format tab - use formatType if available, else detect from first field
    let formatCategory = 'none';
    if (modalField.formatType || modalField.style?.formatType) {
        formatCategory = modalField.formatType || modalField.style?.formatType;
    } else if (modalField.dateFormat || modalField.style?.dateFormat) {
        formatCategory = 'date';
    } else if (modalField.currencySymbol !== undefined || modalField.style?.currencySymbol !== undefined) {
        formatCategory = 'currency';
    } else if (modalField.phoneFormat || modalField.style?.phoneFormat) {
        formatCategory = 'phone';
    } else if (modalField.numberDecimals !== undefined || modalField.style?.numberDecimals !== undefined) {
        formatCategory = 'number';
    } else if (modalField.zipFormat || modalField.style?.zipFormat) {
        formatCategory = 'zip';
    }
    
    document.getElementById('modalFormatCategory').value = formatCategory;
    updateFormatOptions();
    
    // Set format-specific values
    if (formatCategory === 'date') {
        document.getElementById('modalDateFormat').value = modalField.style?.dateFormat || modalField.dateFormat || 'MM/DD/YYYY';
    } else if (formatCategory === 'currency') {
        document.getElementById('modalCurrencySymbol').value = modalField.style?.currencySymbol ?? modalField.currencySymbol ?? '$';
        document.getElementById('modalCurrencyDecimals').value = modalField.style?.currencyDecimals ?? modalField.currencyDecimals ?? 2;
        document.getElementById('modalSymbolLocation').value = modalField.style?.symbolLocation || modalField.symbolLocation || 'before-space';
    } else if (formatCategory === 'phone') {
        document.getElementById('modalPhoneFormat').value = modalField.style?.phoneFormat || modalField.phoneFormat || '(XXX) XXX-XXXX';
    } else if (formatCategory === 'number') {
        document.getElementById('modalNumberDecimals').value = modalField.style?.numberDecimals ?? modalField.numberDecimals ?? 2;
        document.getElementById('modalNumberSeparator').value = modalField.style?.thousandSep ?? modalField.thousandSep ?? ',';
    } else if (formatCategory === 'zip') {
        document.getElementById('modalZipFormat').value = modalField.style?.zipFormat || modalField.zipFormat || 'XXXXX';
    }
    
    // Reset dirty flags after populating — user hasn't changed anything yet
    formatDirty = false;
    fontDirty = false;
}


function switchPropertiesTab(tabName) {
    // Turn off pick mode when switching tabs
    disablePickMode();

    // Update tab buttons
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}


function updateFormatOptions() {
    const category = document.getElementById('modalFormatCategory').value;
    
    // Hide all format options
    document.querySelectorAll('.format-options').forEach(el => el.style.display = 'none');
    
    // Show the selected one
    const optionId = `modalFormat${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const optionEl = document.getElementById(optionId);
    if (optionEl) optionEl.style.display = 'block';
}


function updatePositionDisplay() {
    if (!modalField) return;
    
    const units = document.getElementById('modalPropUnits').value;
    const rect = modalField.rect;
    
    // Conversion factors from points
    const factor = units === 'in' ? 72 : units === 'mm' ? 72/25.4 : 1;
    
    const left = rect[0] / factor;
    const top = rect[1] / factor;
    const width = (rect[2] - rect[0]) / factor;
    const height = (rect[3] - rect[1]) / factor;
    const right = rect[2] / factor;  // Left + Width
    const bottom = rect[3] / factor; // Top + Height
    
    document.getElementById('modalPropLeft').value = left.toFixed(2);
    document.getElementById('modalPropTop').value = top.toFixed(2);
    document.getElementById('modalPropWidth').value = width.toFixed(2);
    document.getElementById('modalPropHeight').value = height.toFixed(2);
    document.getElementById('modalPropRight').value = right.toFixed(2);
    document.getElementById('modalPropBottom').value = bottom.toFixed(2);
    
    // Load "No resize" and "Locked" checkbox states if stored
    const noResize = document.getElementById('modalPropNoResize');
    const posLocked = document.getElementById('modalPropPositionLocked');
    if (noResize) noResize.checked = modalField.noResizeOnMove || false;
    if (posLocked) posLocked.checked = modalField.positionLocked || false;
}


function updatePositionUnits() {
    updatePositionDisplay();
}




function _applyPropertiesFromForm() {
    if (!modalField) return null;

    const updates = {};
    if (!isMultiFieldEdit) {
        updates.name = document.getElementById('modalPropName').value.trim();
        const modalGroupInput = document.getElementById('modalPropRadioGroup');
        if (modalGroupInput && modalField.type === 'radio') {
            updates.radio_group = modalGroupInput.value.trim();
        }

        const units = document.getElementById('modalPropUnits').value;
        const factor = units === 'in' ? 72 : units === 'mm' ? 72/25.4 : 1;

        const left = parseFloat(document.getElementById('modalPropLeft').value) * factor;
        const top = parseFloat(document.getElementById('modalPropTop').value) * factor;
        const width = parseFloat(document.getElementById('modalPropWidth').value) * factor;
        const height = parseFloat(document.getElementById('modalPropHeight').value) * factor;
        updates.rect = [left, top, left + width, top + height];
    }

    const props = {
        tooltip: document.getElementById('modalPropTooltip').value,
        visibility: document.getElementById('modalPropVisibility').value,
        orientation: parseInt(document.getElementById('modalPropOrientation').value),
        readOnly: document.getElementById('modalPropReadOnly').checked,
        required: document.getElementById('modalPropRequired').checked,
        locked: document.getElementById('modalPropLocked').checked,

        borderColor: document.getElementById('modalPropBorderColor').value,
        fillColor: document.getElementById('modalPropFillColor').value,
        lineThickness: parseInt(document.getElementById('modalPropLineThickness').value) || 0,
        lineStyle: document.getElementById('modalPropLineStyle').value,
        checkboxStyle: document.getElementById('modalPropCheckboxStyle')?.value || 'check',

        textAlign: document.getElementById('modalPropAlignment').value,
        defaultValue: document.getElementById('modalPropDefaultValue').value,
        multiline: document.getElementById('modalPropMultiline').checked,
        scrollText: document.getElementById('modalPropScrollText').checked,
        password: document.getElementById('modalPropPassword').checked,
        maxLen: parseInt(document.getElementById('modalPropMaxLen').value) || 0,
        comb: document.getElementById('modalPropComb').checked,

        sort: document.getElementById('modalPropDropdownSort').checked,
        editable: document.getElementById('modalPropDropdownEditable').checked,
        spellCheck: document.getElementById('modalPropDropdownSpellCheck').checked,
        commitImmediately: document.getElementById('modalPropDropdownCommit').checked,
        
        noResizeOnMove: document.getElementById('modalPropNoResize')?.checked || false,
        positionLocked: document.getElementById('modalPropPositionLocked')?.checked || false
    };

    if (modalField.type === 'combobox' || modalField.type === 'listbox') {
         props.options = [...(modalField.options || [])];
    }

    if (fontDirty) {
        props.fontSize = parseFloat(document.getElementById('modalPropFontSize').value);
        props.fontColor = document.getElementById('modalPropTextColor').value;
        props.fontFamily = document.getElementById('modalPropFont').value;
    }

    if (formatDirty) {
        const formatCategory = document.getElementById('modalFormatCategory').value;
        if (formatCategory && formatCategory !== 'none') {
            props.formatType = formatCategory;
        } else {
            props.formatType = '';
        }
        if (formatCategory === 'date') {
            props.dateFormat = document.getElementById('modalDateFormat').value;
        } else if (formatCategory === 'currency') {
            props.currencySymbol = document.getElementById('modalCurrencySymbol').value;
            props.currencyDecimals = parseInt(document.getElementById('modalCurrencyDecimals').value);
            props.symbolLocation = document.getElementById('modalSymbolLocation').value;
        } else if (formatCategory === 'phone') {
            props.phoneFormat = document.getElementById('modalPhoneFormat').value;
        } else if (formatCategory === 'number') {
            props.numberDecimals = parseInt(document.getElementById('modalNumberDecimals').value);
            props.thousandSep = document.getElementById('modalNumberSeparator').value;
        } else if (formatCategory === 'zip') {
            props.zipFormat = document.getElementById('modalZipFormat').value;
        }
    }

    if (modalFieldActions && Object.keys(modalFieldActions).length > 0) {
        props.actions = modalFieldActions;
    }

    updates.props = props;

    // In a multi-edit context, calc is ignored. We signal editor to save.
    // For single, calc is saved if requested (saveCalcFromModal handled that natively, but we need to proxy that).
    
    return updates;
}

// In the panel's separate renderer process, the only way back to the editor
// is IPC — `renderCanvas`, `updatePropertiesPanel`, and `updateFieldList`
// don't exist here, they're in the editor's renderer. The "apply-properties"
// message carries the form values (including Width / Height / Position numbers
// from the Position tab) for the editor to apply; the editor then pushes a
// refreshed field state back via `panel-update`.
//
// Earlier versions of this file had a second pair of definitions below that
// shadowed these via function-declaration hoisting and only called
// _applyPropertiesFromForm() locally plus the non-existent editor helpers —
// which is why editing Width / Height / Position / X / Y in the floating
// panel silently did nothing.
function savePropertiesModalSilent() {
    const updates = _applyPropertiesFromForm();
    if (updates) {
        ipcRenderer.send('panel-to-editor', {
            action: 'apply-properties',
            fieldObj: modalField,
            isMulti: isMultiFieldEdit,
            multiFields: multiFieldSelection,
            updates: updates
        });
    }
}

function savePropertiesModal() {
    savePropertiesModalSilent();
}


function addActionToField() {
    const trigger = document.getElementById('modalActionTrigger').value;
    const script = document.getElementById('modalActionScript').value.trim();
    
    if (!script) {
        return; // Don't add empty scripts
    }
    
    modalFieldActions[trigger] = script;

    // Clear the script textarea
    document.getElementById('modalActionScript').value = '';

    updateActionsListDisplay();
    markUnsaved();
}


function removeActionFromField(trigger) {
    delete modalFieldActions[trigger];
    updateActionsListDisplay();
}


function updateActionsListDisplay() {
    const listEl = document.getElementById('modalActionsList');
    
    if (Object.keys(modalFieldActions).length === 0) {
        listEl.innerHTML = '<p style="font-size: 11px; color: var(--text-secondary);">No actions defined</p>';
        return;
    }
    
    const triggerLabels = {
        'Mouse Up': 'Mouse Up',
        'Mouse Down': 'Mouse Down',
        'Mouse Enter': 'Mouse Enter',
        'Mouse Exit': 'Mouse Exit',
        'On Focus': 'On Focus',
        'On Blur': 'On Blur',
        'Keystroke': 'Keystroke',
        'Format': 'Format',
        'Validate': 'Validate',
        'Calculate': 'Calculate',
        mouseUp: 'Mouse Up',
        mouseDown: 'Mouse Down',
        mouseEnter: 'Mouse Enter',
        mouseExit: 'Mouse Exit',
        onFocus: 'On Focus',
        onBlur: 'On Blur',
        keystroke: 'Keystroke',
        format: 'Format',
        validate: 'Validate',
        calculate: 'Calculate'
    };
    
    let html = '';
    for (const [trigger, script] of Object.entries(modalFieldActions)) {
        const label = triggerLabels[trigger] || trigger;
        const previewScript = script.length > 40 ? script.substring(0, 40) + '...' : script;
        const escapedTrigger = trigger.replace(/'/g, "\\'");
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: var(--bg-secondary); border-radius: 4px; margin-bottom: 4px;">
                <div style="flex: 1; min-width: 0;">
                    <span style="font-size: 11px; color: var(--accent); font-weight: 600;">${label}</span>
                    <br><span style="font-size: 10px; color: var(--text-secondary); font-family: monospace; word-break: break-all;">${previewScript}</span>
                </div>
                <div style="display: flex; gap: 4px; margin-left: 8px;">
                    <button onclick="editActionFromField('${escapedTrigger}')" style="background: var(--accent); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 10px;">✎ Edit</button>
                    <button onclick="removeActionFromField('${escapedTrigger}')" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 10px;">✕</button>
                </div>
            </div>
        `;
    }
    listEl.innerHTML = html;
}


function editActionFromField(trigger) {
    const script = modalFieldActions[trigger];
    if (script) {
        // Set the trigger dropdown to match
        const triggerSelect = document.getElementById('modalActionTrigger');
        // Find matching option (case-insensitive)
        for (const option of triggerSelect.options) {
            if (option.value === trigger || option.text === trigger) {
                triggerSelect.value = option.value;
                break;
            }
        }
        
        // Load script into textarea
        document.getElementById('modalActionScript').value = script;
        
        // Remove from list (will be re-added when user clicks Add)
        delete modalFieldActions[trigger];
        updateActionsListDisplay();
    }
}


function jsLibUpdateDropdowns() {
    const search  = (document.getElementById('jsLibSearch')?.value || '').toLowerCase().trim();
    const catSel  = document.getElementById('jsLibCategory');
    const presSel = document.getElementById('jsLibPreset');
    if (!catSel || !presSel) return;

    const selCat = catSel.value;

    // Filter presets by search + category
    const matches = JS_PRESETS.filter(p => {
        const catMatch = !selCat || p.category === selCat;
        if (!search) return catMatch;
        return catMatch && (
            p.name.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search) ||
            (p.tags || []).some(t => t.includes(search)) ||
            p.category.toLowerCase().includes(search)
        );
    });

    // Rebuild category dropdown to only show categories that have matches when searching
    if (search) {
        const matchingCats = [...new Set(matches.map(m => m.category))];
        const allCats = [...new Set(JS_PRESETS.map(p => p.category))];
        catSel.innerHTML = '<option value="">All Categories</option>' +
            allCats.map(c => `<option value="${c}"${c === selCat ? ' selected' : ''}${!matchingCats.includes(c) ? ' style="color:var(--text-secondary)"' : ''}>${c}${!matchingCats.includes(c) ? ' (0)' : ` (${matches.filter(m => m.category === c).length})`}</option>`).join('');
    }

    // Rebuild preset dropdown
    const prevPreset = presSel.value;
    presSel.innerHTML = `<option value="">-- Select a preset${search ? ` (${matches.length} match${matches.length !== 1 ? 'es' : ''})` : ''} --</option>` +
        matches.map(p => `<option value="${p.id}"${p.id === prevPreset ? ' selected' : ''}>${p.name}</option>`).join('');

    // Re-select previously chosen preset if still valid
    const stillValid = matches.find(p => p.id === prevPreset);
    if (!stillValid) {
        _jsLibCurrentPreset = null;
        jsLibClearPanel();
    } else {
        jsLibOnPresetChange();
    }
}


function jsLibOnCategoryChange() {
    jsLibUpdateDropdowns();
}


function jsLibOnPresetChange() {
    const presSel = document.getElementById('jsLibPreset');
    const preset  = JS_PRESETS.find(p => p.id === presSel?.value);
    _jsLibCurrentPreset = preset || null;

    // Stop any active canvas-pick from a previous preset to avoid stale state
    jsLibStopAllPicks();

    const descEl    = document.getElementById('jsLibDesc');
    const paramsEl  = document.getElementById('jsLibParams');
    const previewEl = document.getElementById('jsLibPreview');
    const insertBtn = document.getElementById('jsLibInsertBtn');

    if (!preset) {
        jsLibClearPanel();
        return;
    }

    if (descEl)   descEl.textContent = preset.description;
    if (paramsEl) {
        if (preset.params.length > 0) {
            paramsEl.style.display = 'block';
            paramsEl.innerHTML = preset.params.map(jsLibRenderParam).join('');
            // Wire up canvas-pick buttons / chip removals after the DOM is in place
            jsLibWireParamControls(preset);
        } else {
            paramsEl.style.display = 'none';
            paramsEl.innerHTML = '';
        }
    }

    jsLibRefreshPreview();
    if (insertBtn) {
        insertBtn.disabled = false;
        insertBtn.style.opacity = '1';
    }
}


// ── JS Snippet Library: parameter rendering ──────────────────────────────────
//
// Beyond the original 'text'/'number' inputs, presets can declare:
//   type: 'field'   — single field name. Renders a typeahead bound to the
//                     document's field list, with a 🎯 button that activates
//                     canvas pick mode for one click.
//   type: 'fields'  — multiple field names. Renders a chip list of already-
//                     chosen names with a typeahead and a 🎯 multi-pick button
//                     that stays active until the user clicks it again.
//   type: 'select'  — fixed set of choices. Renders a <select> with `options`.
// All other types fall through to a plain text/number input.

function jsLibRenderParam(param) {
    const label = `<label style="font-size: 11px; color: var(--text-secondary); width: 130px; flex-shrink: 0;">${jsLibEscapeHtml(param.label)}:</label>`;

    if (param.type === 'field') {
        const id = `jsLibParam_${param.id}`;
        return `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                ${label}
                <input type="text" id="${id}" list="jsLibFieldList" autocomplete="off"
                       class="modal-input"
                       placeholder="${jsLibEscapeAttr(param.placeholder || '')}"
                       style="flex: 1; font-size: 12px; padding: 4px 8px;"
                       oninput="jsLibRefreshPreview()">
                <button type="button" class="js-lib-pick-btn"
                        data-param-id="${param.id}" data-multi="false"
                        title="Pick from canvas — click a field on the page"
                        style="font-size: 11px; padding: 4px 8px; white-space: nowrap;">🎯</button>
            </div>
        `;
    }

    if (param.type === 'fields') {
        const id = `jsLibParam_${param.id}`;
        return `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; align-items: flex-start; gap: 6px;">
                    ${label}
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                        <div id="${id}_chips" class="js-lib-chip-list"
                             style="display: flex; flex-wrap: wrap; gap: 4px; min-height: 22px; padding: 2px 4px; background: rgba(0,0,0,0.15); border-radius: 4px;"></div>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="${id}_input" list="jsLibFieldList" autocomplete="off"
                                   class="modal-input"
                                   placeholder="${jsLibEscapeAttr(param.placeholder || 'Type a name + Enter, or use 🎯')}"
                                   style="flex: 1; font-size: 12px; padding: 4px 8px;"
                                   onkeydown="if(event.key==='Enter'){event.preventDefault();jsLibAddFieldChipFromInput('${param.id}');}">
                            <button type="button" class="js-lib-pick-btn"
                                    data-param-id="${param.id}" data-multi="true"
                                    title="Multi-pick from canvas — click each field, then click button again to stop"
                                    style="font-size: 11px; padding: 4px 8px; white-space: nowrap;">🎯</button>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="${id}" value="">
            </div>
        `;
    }

    if (param.type === 'select') {
        const id = `jsLibParam_${param.id}`;
        const opts = (param.options || [])
            .map(o => {
                const value = (o && o.value !== undefined) ? o.value : o;
                const text  = (o && o.label !== undefined) ? o.label : value;
                return `<option value="${jsLibEscapeAttr(value)}">${jsLibEscapeHtml(text)}</option>`;
            }).join('');
        return `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                ${label}
                <select id="${id}" class="modal-select"
                        style="flex: 1; font-size: 12px; padding: 4px 8px;"
                        onchange="jsLibRefreshPreview()">
                    ${opts}
                </select>
            </div>
        `;
    }

    // Default: plain text / number input
    return `
        <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            ${label}
            <input type="${param.type || 'text'}" id="jsLibParam_${param.id}"
                   class="modal-input"
                   placeholder="${jsLibEscapeAttr(param.placeholder || '')}"
                   ${param.min !== undefined ? `min="${param.min}"` : ''}
                   style="flex: 1; font-size: 12px; padding: 4px 8px;"
                   oninput="jsLibRefreshPreview()">
        </div>
    `;
}

function jsLibEscapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function jsLibEscapeAttr(s) {
    return String(s == null ? '' : s).replace(/"/g, '&quot;');
}

function jsLibWireParamControls(preset) {
    // Refresh the shared <datalist> that powers all field typeahead inputs
    jsLibRefreshFieldDatalist();
    // Wire each canvas-pick button
    document.querySelectorAll('.js-lib-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const paramId = btn.dataset.paramId;
            const isMulti = btn.dataset.multi === 'true';
            jsLibTogglePick(paramId, isMulti, btn);
        });
    });
}

// ── Field-list state shared with the editor ──────────────────────────────────
let _jsLibAllFields = [];   // [{ name, type, page }]
const _jsLibActivePicks = new Map(); // paramId → { btn, multi }

window.jsLibSetAllFields = function (list) {
    _jsLibAllFields = Array.isArray(list) ? list.slice() : [];
    jsLibRefreshFieldDatalist();
};

function jsLibRefreshFieldDatalist() {
    let dl = document.getElementById('jsLibFieldList');
    if (!dl) {
        dl = document.createElement('datalist');
        dl.id = 'jsLibFieldList';
        document.body.appendChild(dl);
    }
    dl.innerHTML = _jsLibAllFields
        .map(f => `<option value="${jsLibEscapeAttr(f.name)}">${jsLibEscapeAttr(f.type || '')}</option>`)
        .join('');
}

// ── Multi-field chip helpers (for type:'fields') ─────────────────────────────
function jsLibGetFieldsValue(paramId) {
    const hidden = document.getElementById(`jsLibParam_${paramId}`);
    return (hidden?.value || '').split(',').map(s => s.trim()).filter(Boolean);
}
function jsLibSetFieldsValue(paramId, list) {
    const hidden = document.getElementById(`jsLibParam_${paramId}`);
    if (hidden) hidden.value = list.join(',');
    const chipsEl = document.getElementById(`jsLibParam_${paramId}_chips`);
    if (chipsEl) {
        chipsEl.innerHTML = list.map((name, idx) => `
            <span class="js-lib-chip" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--accent, #4ade80); color: #000; border-radius: 10px; font-size: 11px;">
                ${jsLibEscapeHtml(name)}
                <span data-idx="${idx}" data-param="${paramId}" onclick="jsLibRemoveFieldChip(this)" style="cursor: pointer; font-weight: bold;">×</span>
            </span>
        `).join('');
    }
    jsLibRefreshPreview();
}
window.jsLibAddFieldChipFromInput = function (paramId) {
    const inp = document.getElementById(`jsLibParam_${paramId}_input`);
    if (!inp) return;
    const v = (inp.value || '').trim();
    if (!v) return;
    const cur = jsLibGetFieldsValue(paramId);
    if (!cur.includes(v)) {
        cur.push(v);
        jsLibSetFieldsValue(paramId, cur);
    }
    inp.value = '';
};
window.jsLibRemoveFieldChip = function (xEl) {
    const paramId = xEl.dataset.param;
    const idx = Number(xEl.dataset.idx);
    const cur = jsLibGetFieldsValue(paramId);
    cur.splice(idx, 1);
    jsLibSetFieldsValue(paramId, cur);
};

// ── Canvas-pick coordination ─────────────────────────────────────────────────
function jsLibTogglePick(paramId, isMulti, btn) {
    const { ipcRenderer } = require('electron');
    const active = _jsLibActivePicks.has(paramId);
    if (active) {
        ipcRenderer.send('panel-to-editor', { action: 'js-lib-pick-stop', payload: { paramId } });
        _jsLibActivePicks.delete(paramId);
        if (btn) {
            btn.classList.remove('active');
            btn.textContent = '🎯';
        }
        return;
    }

    // Stop any other active picks first — only one at a time
    jsLibStopAllPicks();

    _jsLibActivePicks.set(paramId, { btn, multi: isMulti });
    if (btn) {
        btn.classList.add('active');
        btn.textContent = isMulti ? '🎯 Picking… (click to stop)' : '🎯 Picking…';
    }
    const seedNames = isMulti ? jsLibGetFieldsValue(paramId) : [];
    ipcRenderer.send('panel-to-editor', {
        action: 'js-lib-pick-start',
        payload: { paramId, multi: isMulti, names: seedNames },
    });
}

function jsLibStopAllPicks() {
    if (_jsLibActivePicks.size === 0) return;
    const { ipcRenderer } = require('electron');
    for (const [paramId, info] of _jsLibActivePicks) {
        ipcRenderer.send('panel-to-editor', { action: 'js-lib-pick-stop', payload: { paramId } });
        if (info.btn) {
            info.btn.classList.remove('active');
            info.btn.textContent = '🎯';
        }
    }
    _jsLibActivePicks.clear();
}

window.jsLibOnPickResult = function (data) {
    const paramId = data?.paramId;
    const fieldName = data?.fieldName;
    if (!paramId || !fieldName) return;
    const info = _jsLibActivePicks.get(paramId);
    if (!info) return;

    if (info.multi) {
        const cur = jsLibGetFieldsValue(paramId);
        if (!cur.includes(fieldName)) {
            cur.push(fieldName);
            jsLibSetFieldsValue(paramId, cur);
        }
    } else {
        const inp = document.getElementById(`jsLibParam_${paramId}`);
        if (inp) inp.value = fieldName;
        jsLibRefreshPreview();
        // Editor auto-disabled pick mode after first click for single-pick;
        // mirror that on the panel side.
        if (info.btn) {
            info.btn.classList.remove('active');
            info.btn.textContent = '🎯';
        }
        _jsLibActivePicks.delete(paramId);
    }
};

window.jsLibOnPickStopped = function (paramId) {
    if (paramId && _jsLibActivePicks.has(paramId)) {
        const info = _jsLibActivePicks.get(paramId);
        if (info.btn) {
            info.btn.classList.remove('active');
            info.btn.textContent = '🎯';
        }
        _jsLibActivePicks.delete(paramId);
        return;
    }
    // Generic stop (paramId not provided) — clear any active pick
    jsLibStopAllPicks();
};


function jsLibInsert() {
    if (!_jsLibCurrentPreset) return;

    const params = jsLibGetParams();
    // Validate required params (non-empty)
    for (const param of _jsLibCurrentPreset.params) {
        if (!params[param.id] || !params[param.id].trim()) {
            showAlert(`Please fill in the "${param.label}" field before inserting.`, 'Missing Parameter');
            document.getElementById(`jsLibParam_${param.id}`)?.focus();
            return;
        }
    }

    let code;
    try {
        code = _jsLibCurrentPreset.template(params);
    } catch (e) {
        showAlert('Failed to generate code snippet. Check parameters.', 'Error');
        return;
    }

    const textarea = document.getElementById('modalActionScript');
    if (!textarea) return;

    const existing = textarea.value.trim();
    if (existing) {
        // Append with a blank line separator
        textarea.value = existing + '\n\n' + code;
    } else {
        textarea.value = code;
    }

    // Scroll to end of textarea so user can see inserted code
    textarea.scrollTop = textarea.scrollHeight;

    // Visual feedback — briefly highlight the textarea
    textarea.style.outline = '2px solid var(--accent)';
    setTimeout(() => { textarea.style.outline = ''; }, 600);
}



let modalField = null;
let modalOriginalRect = [];
let isMultiFieldEdit = false;
let multiFieldSelection = [];
let formatDirty = false;
let fontDirty = false;
let modalFieldActions = {};
let windowGlobalSettings = {}; // Injected via IPC
let currentCalcSources = [];
let _jsLibCurrentPreset = null;

// Replace windowGlobalSettings with windowGlobalSettings
function renderChoiceList(field, containerId, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const options = field.options || [];
    container.innerHTML = options.map((opt, idx) => {
        // Handle both string format (old) and object format (new)
        const label = typeof opt === 'string' ? opt : (opt.label || '');
        const value = typeof opt === 'string' ? opt : (opt.value || label);
        return `
            <div class="option-item ${field._selectedOptionIdx === idx ? 'selected' : ''}" 
                 onclick="selectChoiceOption('${field.name}', ${idx}, '${containerId}', '${prefix}')">
                <span class="option-label">${label}</span>
                <span class="option-value">${value !== label ? value : ''}</span>
            </div>
        `;
    }).join('');
}


function getTypeLabel(type) {
    const labels = { 'text': 'Text Field', 'checkbox': 'Checkbox', 'radio': 'Radio Button',
                     'button': 'Button', 'combobox': 'Dropdown', 'listbox': 'List Box',
                     'link': 'Hyperlink' };
    return labels[type] || type;
}


function updateColorSwatch(targetId, hex) {
    const input = document.getElementById(targetId);
    if (input) input.value = hex;
    
    const preview = document.getElementById('preview_' + targetId);
    if (preview) {
        if (hex === 'transparent' || !hex) {
            preview.style.background = 'transparent';
            preview.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
            preview.style.backgroundSize = '8px 8px';
        } else {
            preview.style.background = hex;
            preview.style.backgroundImage = 'none';
        }
    }
    
    const label = document.getElementById('text_' + targetId);
    if (label) {
        label.textContent = (hex && hex !== 'transparent') ? hex.toUpperCase() : 'None';
    }
}


function saveCalcFromModal(fieldName) {
    // Only save/delete if user actually modified the Calculate tab this session.
    // This prevents auto-save from accidentally erasing calculations on other
    // fields when the modal UI shows a different field's (or empty) calc state.
    if (!calcDirty) return;

    const calcType = document.getElementById('modalCalcType');
    if (!calcType || !calcType.value || calcSources.length === 0) {
        // No calculation — remove any existing
        delete changes.calculations[fieldName];
        return;
    }

    const calc = {
        type: calcType.value,
        sources: calcSources.map(s => s.name)
    };

    if (calcType.value === 'CUSTOM') {
        // Ensure formula is simplified letter-reference notation, not raw JS
        const rawFormula = document.getElementById('calcCustomFormula').value || '';
        calc.formula = simplifyCalcFormula(rawFormula, calc.sources, fieldName);
    }

    if (calcType.value === 'CUSTOM_SCRIPT') {
        calc.script = document.getElementById('calcCustomScriptCode').value || '';
    }

    if (calcType.value === 'CONSTANT_MULTIPLY') {
        calc.constant = parseFloat(document.getElementById('calcConstantValue').value) || 1;
    }

    const roundCheck = document.getElementById('calcRoundResult');
    const decimalsInput = document.getElementById('calcDecimals');
    if (roundCheck && roundCheck.checked && decimalsInput) {
        calc.decimals = parseInt(decimalsInput.value) || 2;
    }

    const readOnlyCheck = document.getElementById('calcReadOnly');
    if (readOnlyCheck) {
        calc.readOnly = readOnlyCheck.checked;
    }

    changes.calculations[fieldName] = calc;

    // Also store on the field object for display
    const field = fields.find(f => f.name === fieldName);
    if (field) {
        field.calculation = calc;
    }

    markUnsaved();
}


// Function calcAutoDetect not found

function addCalcSource(name, page) {
    if (calcSources.find(s => s.name === name)) return;
    calcSources.push({ name, page });
    calcDirty = true;
    renderCalcSources();
    updateCalcPreview();
    syncCalcSourcesToEditor();
}


function removeCalcSource(name) {
    calcSources = calcSources.filter(s => s.name !== name);
    calcDirty = true;
    renderCalcSources();
    updateCalcPreview();
    syncCalcSourcesToEditor();
}

// Mirror the current calcSources list back to the editor so the canvas
// keeps its green-highlight in sync with the panel — including when the
// user removes a source via the X button (highlight should clear).
function syncCalcSourcesToEditor() {
    try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('panel-to-editor', {
            action: 'calc-sources-sync',
            payload: { names: calcSources.map(s => s.name) },
        });
    } catch (_) {}
}


const JS_PRESETS = [
    // ---- Page Navigation ----
    {
        id: 'nav-goto-page',
        category: 'Page Navigation',
        name: 'Go to Page',
        description: 'Jump the viewer to a specific page number.',
        tags: ['page', 'navigate', 'goto', 'jump', 'hyperlink'],
        params: [{ id: 'pageNum', label: 'Page number', type: 'number', placeholder: '5', min: 1 }],
        template: (p) => `this.pageNum = ${Number(p.pageNum) - 1};  // Go to page ${p.pageNum}`
    },
    {
        id: 'nav-first-page',
        category: 'Page Navigation',
        name: 'Go to First Page',
        description: 'Jump to page 1 of the document.',
        tags: ['page', 'first', 'navigate'],
        params: [],
        template: () => `this.pageNum = 0;  // Go to first page`
    },
    {
        id: 'nav-last-page',
        category: 'Page Navigation',
        name: 'Go to Last Page',
        description: 'Jump to the last page of the document.',
        tags: ['page', 'last', 'navigate'],
        params: [],
        template: () => `this.pageNum = this.numPages - 1;  // Go to last page`
    },
    {
        id: 'nav-next-page',
        category: 'Page Navigation',
        name: 'Go to Next Page',
        description: 'Advance one page forward.',
        tags: ['page', 'next', 'navigate'],
        params: [],
        template: () => `if (this.pageNum < this.numPages - 1) this.pageNum++;`
    },
    {
        id: 'nav-prev-page',
        category: 'Page Navigation',
        name: 'Go to Previous Page',
        description: 'Go back one page.',
        tags: ['page', 'prev', 'previous', 'back', 'navigate'],
        params: [],
        template: () => `if (this.pageNum > 0) this.pageNum--;`
    },
    {
        id: 'nav-open-url',
        category: 'Page Navigation',
        name: 'Open URL',
        description: 'Open a web URL in the user\'s browser.',
        tags: ['url', 'link', 'hyperlink', 'web', 'http', 'navigate'],
        params: [{ id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' }],
        template: (p) => `app.launchURL("${p.url}", true);`
    },
    {
        id: 'nav-named-dest',
        category: 'Page Navigation',
        name: 'Go to Named Destination',
        description: 'Jump to a named destination defined in the PDF.',
        tags: ['destination', 'named', 'navigate', 'goto'],
        params: [{ id: 'dest', label: 'Destination name', type: 'text', placeholder: 'MyDest' }],
        template: (p) => `this.gotoNamedDest("${p.dest}");`
    },

    // ---- Alerts & Dialogs ----
    {
        id: 'dlg-alert',
        category: 'Alerts & Dialogs',
        name: 'Show Alert',
        description: 'Display a simple alert dialog.',
        tags: ['alert', 'message', 'dialog', 'popup'],
        params: [{ id: 'msg', label: 'Message', type: 'text', placeholder: 'Hello!' }],
        template: (p) => `app.alert("${p.msg}");`
    },
    {
        id: 'dlg-confirm',
        category: 'Alerts & Dialogs',
        name: 'Confirm Dialog',
        description: 'Show a yes/no confirm dialog and act on the result.',
        tags: ['confirm', 'dialog', 'yes', 'no'],
        params: [{ id: 'msg', label: 'Prompt message', type: 'text', placeholder: 'Are you sure?' }],
        template: (p) => `var result = app.alert("${p.msg}", 2, 2);\nif (result === 4) {\n    // User clicked Yes\n}`
    },
    {
        id: 'dlg-response',
        category: 'Alerts & Dialogs',
        name: 'Prompt for Input',
        description: 'Show an input dialog and use the entered value.',
        tags: ['prompt', 'input', 'dialog', 'response'],
        params: [{ id: 'msg', label: 'Prompt text', type: 'text', placeholder: 'Enter your name:' }],
        template: (p) => `var val = app.response("${p.msg}", "Input");\nif (val !== null) {\n    this.getField("FIELD_NAME").value = val;\n}`
    },

    // ---- Formatting ----
    {
        id: 'fmt-currency',
        category: 'Formatting',
        name: 'Format as Currency',
        description: 'Format a field as currency — symbol, decimals and symbol position all configurable, just like the Format tab.',
        tags: ['format', 'currency', 'dollar', 'money', 'usd', '$', '€', '£'],
        params: [
            { id: 'decimals', label: 'Decimal places', type: 'number', placeholder: '2', min: 0 },
            { id: 'symbol',   label: 'Currency symbol', type: 'select', options: [
                { value: '$',   label: '$ Dollar' },
                { value: '€',   label: '€ Euro' },
                { value: '£',   label: '£ Pound' },
                { value: '¥',   label: '¥ Yen / Yuan' },
                { value: 'CHF', label: 'CHF Franc' },
                { value: 'kr',  label: 'kr Krone / Krona' },
                { value: 'TL',  label: 'TL Lira' },
                { value: 'R',   label: 'R Rand' },
                { value: 'zł',  label: 'zł Zloty' },
                { value: 'R$',  label: 'R$ Real' },
                { value: '₩',   label: '₩ Won' },
                { value: '₫',   label: '₫ Dong' },
                { value: '',    label: '(none)' },
            ] },
            { id: 'position', label: 'Symbol position', type: 'select', options: [
                { value: 'before', label: 'Before value ($1,234.56)' },
                { value: 'after',  label: 'After value (1,234.56 $)' },
            ] },
            { id: 'separator', label: 'Separator style', type: 'select', options: [
                { value: '0', label: '1,234.56  (US/UK)' },
                { value: '2', label: '1.234,56  (European)' },
                { value: '1', label: '1234.56   (no thousands)' },
                { value: '3', label: '1234,56   (no thousands, EU)' },
            ] },
        ],
        template: (p) => {
            const dec = Number(p.decimals ?? 2);
            const sym = String(p.symbol ?? '$');
            const sep = Number(p.separator ?? 0);
            const prepend = (p.position ?? 'before') === 'before';
            return `AFNumber_Format(${dec}, ${sep}, 0, 0, "${sym}", ${prepend});`;
        }
    },
    {
        id: 'fmt-currency-nodollar',
        category: 'Formatting',
        name: 'Format as Number',
        description: 'Format as a plain number with configurable separator and decimal places (no currency symbol).',
        tags: ['format', 'number', 'decimal', 'comma', 'thousands'],
        params: [
            { id: 'decimals',  label: 'Decimal places', type: 'number', placeholder: '2', min: 0 },
            { id: 'separator', label: 'Separator style', type: 'select', options: [
                { value: '0', label: '1,234.56  (US/UK)' },
                { value: '2', label: '1.234,56  (European)' },
                { value: '1', label: '1234.56   (no thousands)' },
                { value: '3', label: '1234,56   (no thousands, EU)' },
            ] },
        ],
        template: (p) => {
            const dec = Number(p.decimals ?? 2);
            const sep = Number(p.separator ?? 0);
            return `AFNumber_Format(${dec}, ${sep}, 0, 0, "", false);`;
        }
    },
    {
        id: 'fmt-percent',
        category: 'Formatting',
        name: 'Format as Percent',
        description: 'Format a value as a percentage. Decimal places and thousands separator configurable.',
        tags: ['format', 'percent', '%'],
        params: [
            { id: 'dec', label: 'Decimal places', type: 'number', placeholder: '2', min: 0 },
            { id: 'separator', label: 'Separator style', type: 'select', options: [
                { value: '0', label: '12,345.67%  (US/UK)' },
                { value: '2', label: '12.345,67%  (European)' },
                { value: '1', label: '12345.67%   (no thousands)' },
                { value: '3', label: '12345,67%   (no thousands, EU)' },
            ] },
        ],
        template: (p) => `AFPercent_Format(${Number(p.dec ?? 0)}, ${Number(p.separator ?? 0)});`
    },
    {
        id: 'fmt-phone',
        category: 'Formatting',
        name: 'Format Phone Number',
        description: 'Format a field as a US phone number — pick the display style.',
        tags: ['format', 'phone', 'telephone', 'number'],
        params: [
            { id: 'variant', label: 'Phone format', type: 'select', options: [
                { value: 'paren', label: '(XXX) XXX-XXXX' },
                { value: 'dash',  label: 'XXX-XXX-XXXX' },
                { value: 'dot',   label: 'XXX.XXX.XXXX' },
            ] },
        ],
        template: (p) => {
            const v = p.variant ?? 'paren';
            if (v === 'dash') {
                return `// Place on Format trigger\nvar v = (event.value || "").replace(/\\D/g, "");\nif (v.length === 10) {\n    event.value = v.substr(0,3) + "-" + v.substr(3,3) + "-" + v.substr(6,4);\n}`;
            }
            if (v === 'dot') {
                return `// Place on Format trigger\nvar v = (event.value || "").replace(/\\D/g, "");\nif (v.length === 10) {\n    event.value = v.substr(0,3) + "." + v.substr(3,3) + "." + v.substr(6,4);\n}`;
            }
            return `AFSpecial_Format(2);`;
        }
    },
    {
        id: 'fmt-ssn',
        category: 'Formatting',
        name: 'Format Social Security Number',
        description: 'Format a field as SSN: ###-##-####.',
        tags: ['format', 'ssn', 'social security'],
        params: [],
        template: () => `AFSpecial_Format(3);`
    },
    {
        id: 'fmt-zip',
        category: 'Formatting',
        name: 'Format ZIP Code',
        description: 'Format a field as a 5-digit ZIP code or ZIP+4 (#####-####).',
        tags: ['format', 'zip', 'postal', 'zip+4'],
        params: [
            { id: 'variant', label: 'ZIP variant', type: 'select', options: [
                { value: '0', label: '5-digit (#####)' },
                { value: '1', label: 'ZIP+4 (#####-####)' },
            ] },
        ],
        template: (p) => `AFSpecial_Format(${Number(p.variant ?? 0)});`
    },
    {
        id: 'fmt-date',
        category: 'Formatting',
        name: 'Format Date (MM/DD/YYYY)',
        description: 'Format a field value as a date.',
        tags: ['format', 'date', 'time'],
        params: [{ id: 'fmt', label: 'Format string', type: 'text', placeholder: 'mm/dd/yyyy' }],
        template: (p) => `AFDate_FormatEx("${p.fmt || 'mm/dd/yyyy'}");`
    },
    {
        id: 'fmt-uppercase',
        category: 'Formatting',
        name: 'Convert to Uppercase',
        description: 'Force the field text to uppercase as user types.',
        tags: ['format', 'uppercase', 'caps', 'text'],
        params: [],
        template: () => `event.value = event.value.toUpperCase();`
    },
    {
        id: 'fmt-lowercase',
        category: 'Formatting',
        name: 'Convert to Lowercase',
        description: 'Force the field text to lowercase.',
        tags: ['format', 'lowercase', 'text'],
        params: [],
        template: () => `event.value = event.value.toLowerCase();`
    },
    {
        id: 'fmt-titlecase',
        category: 'Formatting',
        name: 'Title Case',
        description: 'Capitalize the first letter of each word.',
        tags: ['format', 'title', 'capitalize', 'text'],
        params: [],
        template: () => `event.value = event.value.replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });`
    },
    {
        id: 'fmt-trim',
        category: 'Formatting',
        name: 'Trim Whitespace',
        description: 'Remove leading and trailing whitespace from the field value.',
        tags: ['format', 'trim', 'whitespace', 'text'],
        params: [],
        template: () => `event.value = event.value.trim();`
    },

    // ---- Validation ----
    {
        id: 'val-required',
        category: 'Validation',
        name: 'Required — Not Empty',
        description: 'Reject empty values with an error message.',
        tags: ['validate', 'required', 'empty', 'blank'],
        params: [{ id: 'msg', label: 'Error message', type: 'text', placeholder: 'This field is required.' }],
        template: (p) => `if (event.value === "" || event.value === null) {\n    app.alert("${p.msg || 'This field is required.'}");\n    event.rc = false;\n}`
    },
    {
        id: 'val-email',
        category: 'Validation',
        name: 'Validate Email',
        description: 'Check that the value looks like an email address.',
        tags: ['validate', 'email', '@', 'address'],
        params: [],
        template: () => `var re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nif (event.value && !re.test(event.value)) {\n    app.alert("Please enter a valid email address.");\n    event.rc = false;\n}`
    },
    {
        id: 'val-phone',
        category: 'Validation',
        name: 'Validate Phone',
        description: 'Accept US phone numbers in common formats.',
        tags: ['validate', 'phone', 'telephone'],
        params: [],
        template: () => `var re = /^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4}$/;\nif (event.value && !re.test(event.value.replace(/\\s/g, ""))) {\n    app.alert("Please enter a valid phone number.");\n    event.rc = false;\n}`
    },
    {
        id: 'val-numeric-range',
        category: 'Validation',
        name: 'Validate Numeric Range',
        description: 'Ensure the numeric value falls between a min and max.',
        tags: ['validate', 'number', 'range', 'min', 'max'],
        params: [
            { id: 'min', label: 'Minimum value', type: 'number', placeholder: '0' },
            { id: 'max', label: 'Maximum value', type: 'number', placeholder: '100' }
        ],
        template: (p) => `var n = parseFloat(event.value);\nif (isNaN(n) || n < ${p.min} || n > ${p.max}) {\n    app.alert("Value must be between ${p.min} and ${p.max}.");\n    event.rc = false;\n}`
    },
    {
        id: 'val-regex',
        category: 'Validation',
        name: 'Validate with Regex',
        description: 'Match the value against a custom regular expression.',
        tags: ['validate', 'regex', 'pattern', 'custom'],
        params: [
            { id: 'pattern', label: 'Regex pattern', type: 'text', placeholder: '^[A-Z]{2}[0-9]{4}$' },
            { id: 'msg', label: 'Error message', type: 'text', placeholder: 'Invalid format.' }
        ],
        template: (p) => `var re = /${p.pattern}/;\nif (event.value && !re.test(event.value)) {\n    app.alert("${p.msg || 'Invalid format.'}");\n    event.rc = false;\n}`
    },
    {
        id: 'val-char-limit',
        category: 'Validation',
        name: 'Character Limit',
        description: 'Reject input exceeding a maximum character count.',
        tags: ['validate', 'limit', 'maxlength', 'characters', 'count'],
        params: [{ id: 'max', label: 'Max characters', type: 'number', placeholder: '50' }],
        template: (p) => `if (event.value.length > ${p.max}) {\n    app.alert("Maximum ${p.max} characters allowed.");\n    event.rc = false;\n}`
    },

    // ---- Calculations ----
    {
        id: 'calc-sum',
        category: 'Calculations',
        name: 'Sum of Fields',
        description: 'Set this field to the sum of other named fields.',
        tags: ['calculate', 'sum', 'total', 'add', 'plus'],
        params: [{ id: 'fields', label: 'Field names (comma-separated)', type: 'text', placeholder: 'Field1, Field2, Field3' }],
        template: (p) => {
            const flds = p.fields.split(',').map(s => s.trim()).filter(Boolean);
            const lines = flds.map(f => `    + (parseFloat(this.getField("${f}").value) || 0)`).join('\n');
            return `var total = 0\n${lines};\nevent.value = total.toFixed(2);`;
        }
    },
    {
        id: 'calc-product',
        category: 'Calculations',
        name: 'Product of Two Fields',
        description: 'Multiply two field values and display the result.',
        tags: ['calculate', 'multiply', 'product', 'times'],
        params: [
            { id: 'a', label: 'Field A name', type: 'text', placeholder: 'Quantity' },
            { id: 'b', label: 'Field B name', type: 'text', placeholder: 'UnitPrice' }
        ],
        template: (p) => `var a = parseFloat(this.getField("${p.a}").value) || 0;\nvar b = parseFloat(this.getField("${p.b}").value) || 0;\nevent.value = (a * b).toFixed(2);`
    },
    {
        id: 'calc-average',
        category: 'Calculations',
        name: 'Average of Fields',
        description: 'Calculate the average of a list of named fields.',
        tags: ['calculate', 'average', 'mean'],
        params: [{ id: 'fields', label: 'Field names (comma-separated)', type: 'text', placeholder: 'Score1, Score2, Score3' }],
        template: (p) => {
            const flds = p.fields.split(',').map(s => s.trim()).filter(Boolean);
            const lines = flds.map(f => `    parseFloat(this.getField("${f}").value) || 0`).join(',\n');
            return `var vals = [\n${lines}\n];\nvar sum = vals.reduce(function(a, b) { return a + b; }, 0);\nevent.value = (sum / vals.length).toFixed(2);`;
        }
    },
    {
        id: 'calc-diff',
        category: 'Calculations',
        name: 'Difference (A minus B)',
        description: 'Subtract Field B from Field A.',
        tags: ['calculate', 'subtract', 'difference', 'minus'],
        params: [
            { id: 'a', label: 'Field A (minuend)', type: 'text', placeholder: 'Total' },
            { id: 'b', label: 'Field B (subtracted)', type: 'text', placeholder: 'Discount' }
        ],
        template: (p) => `var a = parseFloat(this.getField("${p.a}").value) || 0;\nvar b = parseFloat(this.getField("${p.b}").value) || 0;\nevent.value = (a - b).toFixed(2);`
    },

    // ---- Field Control ----
    {
        id: 'field-show',
        category: 'Field Control',
        name: 'Show a Field',
        description: 'Make a hidden field visible.',
        tags: ['field', 'show', 'visible', 'display', 'toggle'],
        params: [{ id: 'name', label: 'Field name to show', type: 'text', placeholder: 'MyField' }],
        template: (p) => `this.getField("${p.name}").display = display.visible;`
    },
    {
        id: 'field-hide',
        category: 'Field Control',
        name: 'Hide a Field',
        description: 'Make a field invisible.',
        tags: ['field', 'hide', 'invisible', 'toggle'],
        params: [{ id: 'name', label: 'Field name to hide', type: 'text', placeholder: 'MyField' }],
        template: (p) => `this.getField("${p.name}").display = display.hidden;`
    },
    {
        id: 'field-set-value',
        category: 'Field Control',
        name: 'Set Field Value',
        description: 'Programmatically set another field\'s value.',
        tags: ['field', 'set', 'value', 'assign'],
        params: [
            { id: 'name', label: 'Target field name', type: 'text', placeholder: 'MyField' },
            { id: 'val', label: 'Value to set', type: 'text', placeholder: 'Hello' }
        ],
        template: (p) => `this.getField("${p.name}").value = "${p.val}";`
    },
    {
        id: 'field-reset',
        category: 'Field Control',
        name: 'Reset a Field',
        description: 'Clear a field back to its default value.',
        tags: ['field', 'reset', 'clear', 'blank'],
        params: [{ id: 'name', label: 'Field name', type: 'text', placeholder: 'MyField' }],
        template: (p) => `this.resetForm(["${p.name}"]);`
    },
    {
        id: 'field-focus',
        category: 'Field Control',
        name: 'Move Focus to Field',
        description: 'Set keyboard focus on another field.',
        tags: ['field', 'focus', 'jump', 'tab'],
        params: [{ id: 'name', label: 'Field name', type: 'text', placeholder: 'NextField' }],
        template: (p) => `this.getField("${p.name}").setFocus();`
    },
    {
        id: 'field-enable',
        category: 'Field Control',
        name: 'Enable a Field',
        description: 'Make a read-only field editable.',
        tags: ['field', 'enable', 'readonly', 'editable'],
        params: [{ id: 'name', label: 'Field name', type: 'text', placeholder: 'MyField' }],
        template: (p) => `this.getField("${p.name}").readonly = false;`
    },
    {
        id: 'field-disable',
        category: 'Field Control',
        name: 'Disable a Field (Read-Only)',
        description: 'Prevent the user from editing a field.',
        tags: ['field', 'disable', 'readonly', 'lock'],
        params: [{ id: 'name', label: 'Field name', type: 'text', placeholder: 'MyField' }],
        template: (p) => `this.getField("${p.name}").readonly = true;`
    },
    {
        id: 'field-show-hide-toggle',
        category: 'Field Control',
        name: 'Toggle Show/Hide Based on Checkbox',
        description: 'Show or hide a field based on whether a checkbox is checked.',
        tags: ['field', 'show', 'hide', 'checkbox', 'toggle', 'conditional'],
        params: [
            { id: 'checkbox', label: 'Checkbox field name', type: 'text', placeholder: 'MyCheckbox' },
            { id: 'target', label: 'Field to show/hide', type: 'text', placeholder: 'ConditionalField' }
        ],
        template: (p) => `var cb = this.getField("${p.checkbox}");\nvar tf = this.getField("${p.target}");\ntf.display = (cb.value !== "Off") ? display.visible : display.hidden;`
    },

    // ---- Form Actions ----
    {
        id: 'form-reset-all',
        category: 'Form Actions',
        name: 'Reset Entire Form',
        description: 'Clear all field values back to defaults.',
        tags: ['form', 'reset', 'clear', 'all'],
        params: [],
        template: () => `this.resetForm();`
    },
    {
        id: 'form-print',
        category: 'Form Actions',
        name: 'Print Document',
        description: 'Open the print dialog.',
        tags: ['form', 'print'],
        params: [],
        template: () => `this.print({ bUI: true, bSilent: false });`
    },
    {
        id: 'form-print-silent',
        category: 'Form Actions',
        name: 'Print Document (No Dialog)',
        description: 'Print immediately without showing a dialog.',
        tags: ['form', 'print', 'silent'],
        params: [],
        template: () => `this.print({ bUI: false, bSilent: true });`
    },
    {
        id: 'form-email',
        category: 'Form Actions',
        name: 'Email Document',
        description: 'Open a compose email window with the PDF attached.',
        tags: ['form', 'email', 'send', 'submit', 'mail'],
        params: [
            { id: 'to', label: 'To address', type: 'text', placeholder: 'recipient@example.com' },
            { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Completed Form' }
        ],
        template: (p) => `this.mailDoc({ bUI: true, cTo: "${p.to}", cSubject: "${p.subject}" });`
    },
    {
        id: 'form-submit-url',
        category: 'Form Actions',
        name: 'Submit Form to URL',
        description: 'Submit the form data to a server endpoint.',
        tags: ['form', 'submit', 'url', 'server', 'post'],
        params: [{ id: 'url', label: 'Submission URL', type: 'text', placeholder: 'https://example.com/submit' }],
        template: (p) => `this.submitForm({ cURL: "${p.url}", cSubmitAs: "FDF" });`
    },

    // ---- Date & Time ----
    {
        id: 'date-today',
        category: 'Date & Time',
        name: 'Insert Today\'s Date',
        description: 'Set this field to today\'s date on open/click.',
        tags: ['date', 'today', 'now', 'current'],
        params: [{ id: 'fmt', label: 'Format', type: 'text', placeholder: 'mm/dd/yyyy' }],
        template: (p) => {
            const fmt = p.fmt || 'mm/dd/yyyy';
            return `var d = util.printd("${fmt}", new Date());\nevent.value = d;`;
        }
    },
    {
        id: 'date-timestamp',
        category: 'Date & Time',
        name: 'Insert Date & Time Stamp',
        description: 'Set this field to the current date and time.',
        tags: ['date', 'time', 'timestamp', 'now'],
        params: [],
        template: () => `var d = util.printd("mm/dd/yyyy HH:MM:ss", new Date());\nevent.value = d;`
    },

    // ---- Utility ----
    {
        id: 'util-word-count',
        category: 'Utility',
        name: 'Show Word Count',
        description: 'Count words in this field and display in another field.',
        tags: ['utility', 'word', 'count', 'length'],
        params: [{ id: 'target', label: 'Display-in field name', type: 'text', placeholder: 'WordCountField' }],
        template: (p) => `var words = event.value.trim().split(/\\s+/).filter(function(w) { return w.length > 0; });\nthis.getField("${p.target}").value = words.length + " words";`
    },
    {
        id: 'util-copy-value',
        category: 'Utility',
        name: 'Copy Value to Another Field',
        description: 'Mirror this field\'s value into another field.',
        tags: ['utility', 'copy', 'mirror', 'sync'],
        params: [{ id: 'target', label: 'Target field name', type: 'text', placeholder: 'TargetField' }],
        template: (p) => `this.getField("${p.target}").value = event.value;`
    },
    {
        id: 'util-concat',
        category: 'Utility',
        name: 'Concatenate Fields',
        description: 'Join two fields (A + separator + B) into this field.',
        tags: ['utility', 'concat', 'join', 'combine', 'text'],
        params: [
            { id: 'a', label: 'First field', type: 'text', placeholder: 'FirstName' },
            { id: 'sep', label: 'Separator', type: 'text', placeholder: ' ' },
            { id: 'b', label: 'Second field', type: 'text', placeholder: 'LastName' }
        ],
        template: (p) => `var a = this.getField("${p.a}").value || "";\nvar b = this.getField("${p.b}").value || "";\nevent.value = a + "${p.sep}" + b;`
    },
    {
        id: 'util-debug',
        category: 'Utility',
        name: 'Debug: Show Field Value',
        description: 'Alert the current value of a field (for debugging).',
        tags: ['utility', 'debug', 'test', 'alert', 'value'],
        params: [{ id: 'name', label: 'Field name', type: 'text', placeholder: 'MyField' }],
        template: (p) => `app.alert("${p.name} = " + this.getField("${p.name}").value);`
    },

    // =====================================================================
    // ---- v1.2.8 additions ----
    // =====================================================================

    // ---- Field Control ----
    {
        id: 'fc-button-import-icon',
        category: 'Field Control',
        name: 'Button: Import Image',
        description: 'Prompt the user to import an image into this button (button\'s Layout must be set to "Icon only" or similar).',
        tags: ['button', 'image', 'icon', 'import', 'photo'],
        params: [],
        template: () => `event.target.buttonImportIcon();`
    },
    {
        id: 'fc-button-no-border',
        category: 'Field Control',
        name: 'Button: Remove Border',
        description: 'Set this button\'s border line width to 0 (no visible border).',
        tags: ['button', 'border', 'lineWidth'],
        params: [],
        template: () => `event.target.lineWidth = 0;`
    },
    {
        id: 'fc-button-import-scale',
        category: 'Field Control',
        name: 'Button: Import Image (Always Scale)',
        description: 'Import an image into this button and force it to always scale to fit.',
        tags: ['button', 'image', 'icon', 'import', 'scale'],
        params: [],
        template: () => `event.target.buttonImportIcon();\nevent.target.buttonScaleWhen = scaleWhen.always;`
    },
    {
        id: 'fc-cb-exclusive-one',
        category: 'Field Control',
        name: 'Exclusive Checkbox (Uncheck One Other)',
        description: 'When this checkbox is checked, uncheck a single other checkbox. Place on each member of the group.',
        tags: ['checkbox', 'exclusive', 'mutually exclusive', 'group'],
        params: [{ id: 'other', label: 'Checkbox to uncheck', type: 'text', placeholder: 'cb2' }],
        template: (p) => `if (event.target.value !== "Off") {\n    this.getField("${p.other}").value = "Off";\n}`
    },
    {
        id: 'fc-cb-exclusive-many',
        category: 'Field Control',
        name: 'Exclusive Checkbox (Uncheck Several)',
        description: 'When this checkbox is checked, uncheck several other checkboxes. Comma-separated list of names.',
        tags: ['checkbox', 'exclusive', 'mutually exclusive', 'group', 'radio'],
        params: [{ id: 'others', label: 'Checkboxes to uncheck (comma-separated)', type: 'text', placeholder: 'cb1,cb2,cb3' }],
        template: (p) => {
            const list = String(p.others || '').split(',').map(s => s.trim()).filter(Boolean);
            const lines = list.map(n => `    this.getField("${n}").value = "Off";`).join('\n');
            return `if (event.target.value !== "Off") {\n${lines}\n}`;
        }
    },
    {
        id: 'fc-cb-lock-clear',
        category: 'Field Control',
        name: 'Checkbox Locks + Clears Another Field',
        description: 'When this checkbox is checked, mark another field read-only and clear its value. When unchecked, unlock it.',
        tags: ['checkbox', 'readonly', 'lock', 'clear', 'disable'],
        params: [{ id: 'target', label: 'Field to lock', type: 'text', placeholder: 'OtherField' }],
        template: (p) => `if (event.target.value === "Off") {\n    this.getField("${p.target}").readonly = false;\n} else {\n    this.getField("${p.target}").readonly = true;\n    this.getField("${p.target}").value = "";\n}`
    },
    {
        id: 'fc-cb-set-value',
        category: 'Field Control',
        name: 'Checkbox Sets Another Field\'s Value',
        description: 'When this checkbox is checked, set a target field to a value. When unchecked, clear it.',
        tags: ['checkbox', 'pass', 'value', 'set'],
        params: [
            { id: 'target', label: 'Target field', type: 'text', placeholder: 'TargetField' },
            { id: 'val', label: 'Value when checked', type: 'text', placeholder: 'Yes' }
        ],
        template: (p) => `if (event.target.value !== "Off") {\n    this.getField("${p.target}").value = "${p.val}";\n} else {\n    this.getField("${p.target}").value = "";\n}`
    },
    {
        id: 'fc-cb-clears-text',
        category: 'Field Control',
        name: 'Checkbox Clears a Text Field',
        description: 'When this checkbox is checked, clear a target text field. Place on this checkbox\'s Mouse Up trigger.',
        tags: ['checkbox', 'clear', 'text'],
        params: [{ id: 'target', label: 'Text field to clear', type: 'text', placeholder: 'MyTextField' }],
        template: (p) => `if (event.target.value !== "Off") {\n    this.getField("${p.target}").value = "";\n}`
    },
    {
        id: 'fc-text-clears-cb',
        category: 'Field Control',
        name: 'Text Field Unchecks a Checkbox When Filled',
        description: 'When this text field is filled in, uncheck a related checkbox. Place on this text field\'s Validate trigger.',
        tags: ['text', 'checkbox', 'clear', 'cancel', 'mutually exclusive'],
        params: [{ id: 'target', label: 'Checkbox to uncheck', type: 'text', placeholder: 'MyCheckbox' }],
        template: (p) => `if (event.value && String(event.value).length > 0) {\n    this.getField("${p.target}").value = "Off";\n}`
    },

    // ---- Formatting ----
    {
        id: 'fmt-placeholder-focus',
        category: 'Formatting',
        name: 'Placeholder: Clear Default on Focus',
        description: 'On Focus, clear the field if it still shows its default value. Pair with the matching Blur preset.',
        tags: ['placeholder', 'default', 'focus', 'on focus', 'clear'],
        params: [],
        template: () => `// Place on the field's "On Focus" trigger\nif (event.target.value === event.target.defaultValue) {\n    event.target.value = "";\n}`
    },
    {
        id: 'fmt-placeholder-blur',
        category: 'Formatting',
        name: 'Placeholder: Restore Default on Blur',
        description: 'On Blur, restore the default value if the user left the field empty. Pair with the Focus preset.',
        tags: ['placeholder', 'default', 'blur', 'on blur', 'restore'],
        params: [],
        template: () => `// Place on the field's "On Blur" trigger\nif (event.target.value === "") {\n    event.target.value = event.target.defaultValue;\n}`
    },
    {
        id: 'fmt-placeholder-color-focus',
        category: 'Formatting',
        name: 'Placeholder w/ Color: Clear + Black on Focus',
        description: 'On Focus, clear the default value and switch text to black (assumes default is shown in gray).',
        tags: ['placeholder', 'default', 'focus', 'color', 'black'],
        params: [],
        template: () => `// Place on the field's "On Focus" trigger\nif (event.target.value === event.target.defaultValue) {\n    event.target.value = "";\n    event.target.textColor = color.black;\n}`
    },
    {
        id: 'fmt-placeholder-color-blur',
        category: 'Formatting',
        name: 'Placeholder w/ Color: Restore + Gray on Blur',
        description: 'On Blur, restore the default value and color it gray.',
        tags: ['placeholder', 'default', 'blur', 'color', 'gray'],
        params: [],
        template: () => `// Place on the field's "On Blur" trigger\nif (event.target.value === "") {\n    event.target.value = event.target.defaultValue;\n    event.target.textColor = color.gray;\n}`
    },
    {
        id: 'fmt-set-font',
        category: 'Formatting',
        name: 'Set Text Font',
        description: 'Set this field\'s typeface. Common values: "Helv", "TiRo", "Times-BoldItalic", "Courier", "Cour".',
        tags: ['font', 'typeface', 'format'],
        params: [{ id: 'fontName', label: 'Font name', type: 'text', placeholder: 'Times-BoldItalic' }],
        template: (p) => `event.target.textFont = "${p.fontName}";`
    },
    {
        id: 'fmt-cond-text-color-zero',
        category: 'Formatting',
        name: 'Conditional Text Color (Hide When 0)',
        description: 'Make the text white when the value is 0 (effectively hides it), black otherwise. Place on Validate.',
        tags: ['color', 'conditional', 'zero', 'hide', 'white'],
        params: [],
        template: () => `// Place on the field's "Validate" trigger\nif (event.value == 0) {\n    event.target.textColor = color.white;\n} else {\n    event.target.textColor = color.black;\n}`
    },
    {
        id: 'fmt-cb-text-color',
        category: 'Formatting',
        name: 'Checkbox Sets Text Color of Another Field',
        description: 'When this checkbox is unchecked, gray a target field\'s text; when checked, switch it to black.',
        tags: ['checkbox', 'color', 'textColor'],
        params: [{ id: 'target', label: 'Target field', type: 'text', placeholder: 'T1' }],
        template: (p) => `this.getField("${p.target}").textColor = (event.target.value === "Off")\n    ? ["RGB", 168/255, 168/255, 165/255]\n    : ["RGB", 0/255, 0/255, 0/255];`
    },
    {
        id: 'fmt-cb-fill-color',
        category: 'Formatting',
        name: 'Checkbox Sets Fill Color of Another Field',
        description: 'When this checkbox is checked, highlight a target text field with yellow fill; transparent when unchecked.',
        tags: ['checkbox', 'color', 'fill', 'highlight', 'background'],
        params: [{ id: 'target', label: 'Target field', type: 'text', placeholder: 'Text1' }],
        template: (p) => `this.getField("${p.target}").fillColor = (event.target.value === "Off")\n    ? color.transparent\n    : color.yellow;`
    },
    {
        id: 'fmt-currency-rich',
        category: 'Formatting',
        name: 'Format as Currency w/ Superscript $ and Cents',
        description: 'Display a number as currency with the "$" sign and cents both rendered as superscript. Place on Format trigger.',
        tags: ['currency', 'rich', 'superscript', 'format', '$'],
        params: [],
        template: () => `// Place on the field's "Format" trigger\nvar spans = new Array();\nspans[0] = new Object();\nspans[0].text = "$";\nspans[0].superscript = true;\nvar fDollars = Math.floor(event.value);\nspans[1] = new Object();\nspans[1].superscript = false;\nspans[1].text = util.printf("%.0f", fDollars);\nvar fCents = (event.value % 1) * 100;\nspans[2] = new Object();\nspans[2].superscript = true;\nspans[2].text = util.printf("%02.0f", fCents);\nevent.richValue = spans;`
    },

    // ---- Calculations ----
    {
        id: 'calc-percent-of',
        category: 'Calculations',
        name: 'Percentage of a Field',
        description: 'Set this field to N% of another field\'s value (e.g. 5% of price for tax).',
        tags: ['calculation', 'percent', 'multiply', 'percentage'],
        params: [
            { id: 'src', label: 'Source field', type: 'text', placeholder: 'SourceField' },
            { id: 'pct', label: 'Percentage', type: 'number', placeholder: '5', min: 0 }
        ],
        template: (p) => `event.value = this.getField("${p.src}").value * ${(Number(p.pct) || 0) / 100};`
    },
    {
        id: 'calc-cond-sum',
        category: 'Calculations',
        name: 'Conditional Sum (only if guard non-empty)',
        description: 'Sum two fields and divide by a third — but only when the guard field is non-empty.',
        tags: ['calculation', 'conditional', 'sum', 'guard'],
        params: [
            { id: 'a', label: 'Field A', type: 'text', placeholder: 'f20' },
            { id: 'b', label: 'Field B', type: 'text', placeholder: 'f21' },
            { id: 'guard', label: 'Guard / divisor field', type: 'text', placeholder: 'f22' }
        ],
        template: (p) => `if (this.getField("${p.guard}").value !== "") {\n    event.value = (this.getField("${p.a}").value + this.getField("${p.b}").value) / this.getField("${p.guard}").value;\n}`
    },
    {
        id: 'calc-lookup-numeric',
        category: 'Calculations',
        name: 'Lookup by Numeric Range',
        description: 'Map ranges of a source field to fixed values (≤9 → 1, ≤19 → 2, ≤28 → 3, else blank). Edit thresholds in the inserted code.',
        tags: ['calculation', 'lookup', 'if else', 'range', 'switch'],
        params: [{ id: 'src', label: 'Source field', type: 'text', placeholder: 't1' }],
        template: (p) => `var v = Number(this.getField("${p.src}").value);\nif (v <= 9) event.value = 1;\nelse if (v <= 19) event.value = 2;\nelse if (v <= 28) event.value = 3;\nelse event.value = "";`
    },
    {
        id: 'calc-lookup-string',
        category: 'Calculations',
        name: 'Lookup by String (e.g. dropdown → mapped value)',
        description: 'Map a dropdown / text field\'s string value to a fixed output. Edit the keys/values in the inserted code.',
        tags: ['calculation', 'lookup', 'if else', 'string', 'dropdown', 'switch'],
        params: [{ id: 'src', label: 'Source field', type: 'text', placeholder: 'Insurance' }],
        template: (p) => `var key = this.getField("${p.src}").valueAsString;\nif (key === "Option A") event.value = "Result A";\nelse if (key === "Option B") event.value = "Result B";\nelse if (key === "Option C") event.value = "Result C";\nelse event.value = "";`
    },

    // ---- Validation ----
    {
        id: 'val-clear-gt',
        category: 'Validation',
        name: 'Clear if Greater Than N',
        description: 'On Validate, clear the field if its value exceeds a threshold.',
        tags: ['validate', 'clear', 'maximum', 'limit', 'greater than'],
        params: [{ id: 'limit', label: 'Maximum allowed', type: 'number', placeholder: '100', min: 0 }],
        template: (p) => `if (event.value > ${Number(p.limit) || 0}) {\n    event.value = "";\n}`
    },
    {
        id: 'val-clear-zero',
        category: 'Validation',
        name: 'Clear if Zero',
        description: 'On Validate, blank the field if its value is exactly 0.',
        tags: ['validate', 'clear', 'zero', 'empty'],
        params: [],
        template: () => `if (event.value == 0) event.value = "";`
    },

    // ---- Date & Time ----
    {
        id: 'date-add-days-self',
        category: 'Date & Time',
        name: 'Add N Days (in this field)',
        description: 'Take this field\'s date value and add N days, replacing it in place. Place on Validate trigger.',
        tags: ['date', 'add', 'days', 'arithmetic', 'plus'],
        params: [{ id: 'days', label: 'Days to add', type: 'number', placeholder: '14' }],
        template: (p) => `// Place on the field's "Validate" trigger\nvar inputDate = event.value;\nif (inputDate) {\n    var d = util.scand("mm/dd/yyyy", inputDate);\n    if (d) {\n        d.setDate(d.getDate() + ${Number(p.days) || 0});\n        event.value = util.printd("mm/dd/yyyy", d);\n    }\n}`
    },
    {
        id: 'date-add-days-other',
        category: 'Date & Time',
        name: 'Add N Days → Other Field',
        description: 'Read this field\'s date, add N days, and write the result into another field.',
        tags: ['date', 'add', 'days', 'arithmetic', 'plus', 'other'],
        params: [
            { id: 'days', label: 'Days to add', type: 'number', placeholder: '14' },
            { id: 'target', label: 'Target field', type: 'text', placeholder: 'DueDate' }
        ],
        template: (p) => `var d = util.scand("mm/dd/yyyy", event.value);\nif (event.value === "" || !d) {\n    this.getField("${p.target}").value = "";\n} else {\n    d.setDate(d.getDate() + ${Number(p.days) || 0});\n    this.getField("${p.target}").value = util.printd("mm/dd/yyyy", d);\n}`
    },

    // ---- Form Actions ----
    {
        id: 'form-lock-all',
        category: 'Form Actions',
        name: 'Lock Entire Form (Make All Fields Read-Only)',
        description: 'Iterate every field in the document and set readonly = true. Useful on a "Lock" button.',
        tags: ['form', 'readonly', 'lock', 'all fields'],
        params: [],
        template: () => `for (var i = 0; i < this.numFields; i++) {\n    var fname = this.getNthFieldName(i);\n    this.getField(fname).readonly = true;\n}`
    },
    {
        id: 'form-open-embedded',
        category: 'Form Actions',
        name: 'Open Embedded PDF',
        description: 'Open a PDF that is embedded inside this document as a file attachment.',
        tags: ['attachment', 'embed', 'open', 'pdf', 'launch'],
        params: [{ id: 'name', label: 'Embedded file name', type: 'text', placeholder: 'instructions.pdf' }],
        template: (p) => `this.exportDataObject({ cName: "${p.name}", nLaunch: 2 });`
    },

    // ---- Attachments ----
    {
        id: 'att-list-names',
        category: 'Attachments',
        name: 'List Attachment Names in a Field',
        description: 'Read all file attachments on this PDF and write their names (one per line) into a target text field.',
        tags: ['attachment', 'list', 'names', 'file'],
        params: [{ id: 'target', label: 'Target text field', type: 'text', placeholder: 'AttachmentNamesField' }],
        template: (p) => `var names = [];\nvar atts = this.dataObjects || [];\nfor (var i = 0; i < atts.length; i++) {\n    names.push(atts[i].name);\n}\nthis.getField("${p.target}").value = names.join("\\n");`
    },
    {
        id: 'att-update-fn',
        category: 'Attachments',
        name: 'Function: Update Attachment-Names Field',
        description: 'Define a reusable function that refreshes a field with the current list of attachment names, then call it.',
        tags: ['attachment', 'function', 'update', 'list'],
        params: [{ id: 'target', label: 'Target text field', type: 'text', placeholder: 'AttachmentList' }],
        template: (p) => `function updateAttachmentsField() {\n    var atts = this.dataObjects || [];\n    var names = [];\n    for (var i = 0; i < atts.length; i++) {\n        names.push(atts[i].name);\n    }\n    this.getField("${p.target}").value = names.join("\\n");\n}\nupdateAttachmentsField();`
    },
    {
        id: 'att-attach-button',
        category: 'Attachments',
        name: 'Attach File Button',
        description: 'Prompt the user to attach a file to this PDF. Place on a button\'s Mouse Up trigger.',
        tags: ['attachment', 'attach', 'file', 'import', 'button'],
        params: [],
        template: () => `try {\n    var rc = this.importDataObject("Attachment_" + (new Date()).getTime());\n    if (rc) {\n        app.alert({ cMsg: "Attachment successful.", cTitle: "Attached", nIcon: 3, nType: 0 });\n    } else {\n        app.alert({ cMsg: "Attachment cancelled.", cTitle: "Cancelled", nIcon: 3, nType: 0 });\n    }\n} catch (e) {\n    app.alert({ cMsg: "Could not attach file: " + e, cTitle: "Error", nIcon: 0, nType: 0 });\n}`
    }
];

// ── Promote field-name params to first-class types ───────────────────────────
//
// Most presets declare a `target` / `src` / `name` / `a` / `b` etc. with
// type:'text'. We rewrite those at load time to type:'field' (or 'fields' for
// comma-separated lists) so the renderer shows a typeahead bound to the
// document's field list plus a 🎯 canvas-pick button — instead of a blank
// text input the user has to type into manually.
//
// Per-preset exceptions live in PARAM_NOT_FIELD; everything else picks up the
// field type purely from the param id, which keeps adding new presets cheap.
(function applyJsLibParamTypes() {
    const FIELD_IDS  = new Set(['name', 'target', 'src', 'other', 'a', 'b', 'guard', 'checkbox']);
    const FIELDS_IDS = new Set(['fields', 'others']);

    // Param ids that LOOK like fields but actually aren't, keyed by "presetId:paramId"
    const NOT_FIELD = new Set([
        'form-open-embedded:name', // PDF file name embedded in document
        'nav-named-dest:dest',     // PDF named destination (no `name` overlap, but safe to list)
    ]);

    const DATE_FORMAT_OPTIONS = [
        { value: 'mm/dd/yyyy',   label: 'mm/dd/yyyy   (12/31/2025)' },
        { value: 'dd/mm/yyyy',   label: 'dd/mm/yyyy   (31/12/2025)' },
        { value: 'yyyy-mm-dd',   label: 'yyyy-mm-dd   (2025-12-31)' },
        { value: 'm/d/yyyy',     label: 'm/d/yyyy     (1/3/2025)' },
        { value: 'mm/dd/yy',     label: 'mm/dd/yy     (12/31/25)' },
        { value: 'mmm d, yyyy',  label: 'mmm d, yyyy  (Dec 31, 2025)' },
        { value: 'mmmm d, yyyy', label: 'mmmm d, yyyy (December 31, 2025)' },
        { value: 'dd-mmm-yyyy',  label: 'dd-mmm-yyyy  (31-Dec-2025)' },
    ];

    const FONT_OPTIONS = [
        { value: 'Helv', label: 'Helvetica' },
        { value: 'HeBo', label: 'Helvetica Bold' },
        { value: 'HeOb', label: 'Helvetica Oblique' },
        { value: 'HeBO', label: 'Helvetica Bold Oblique' },
        { value: 'TiRo', label: 'Times Roman' },
        { value: 'TiBo', label: 'Times Bold' },
        { value: 'TiIt', label: 'Times Italic' },
        { value: 'TiBI', label: 'Times Bold Italic' },
        { value: 'Cour', label: 'Courier' },
        { value: 'CoBo', label: 'Courier Bold' },
        { value: 'CoOb', label: 'Courier Oblique' },
        { value: 'CoBO', label: 'Courier Bold Oblique' },
        { value: 'Symbol', label: 'Symbol' },
        { value: 'ZaDb',   label: 'ZapfDingbats' },
    ];

    for (const preset of JS_PRESETS) {
        if (!preset.params) continue;
        for (const param of preset.params) {
            const key = `${preset.id}:${param.id}`;
            if (NOT_FIELD.has(key)) continue;

            // Field promotions only apply to text-typed params
            if (param.type === 'text' || !param.type) {
                if (FIELD_IDS.has(param.id)) {
                    param.type = 'field';
                } else if (FIELDS_IDS.has(param.id)) {
                    param.type = 'fields';
                }
            }

            // Format-string + font-name overrides — give the user a real picklist
            if ((preset.id === 'fmt-date' || preset.id === 'date-today') && param.id === 'fmt') {
                param.type = 'select';
                param.options = DATE_FORMAT_OPTIONS;
            }
            if (preset.id === 'fmt-set-font' && param.id === 'fontName') {
                param.type = 'select';
                param.options = FONT_OPTIONS;
            }
        }
    }
})();


