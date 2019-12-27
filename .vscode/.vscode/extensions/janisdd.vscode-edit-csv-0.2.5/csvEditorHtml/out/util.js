"use strict";
function _getById(id) {
    const el = document.getElementById(id);
    if (!el) {
        _error(`could not find element with id '${id}'`);
        return null;
    }
    return el;
}
function isCommentCell(value, csvReadConfig) {
    if (value === null)
        return false;
    if (typeof csvReadConfig.comments === 'string' && csvReadConfig.comments !== '') {
        return value.trimLeft().startsWith(csvReadConfig.comments);
    }
    return false;
}
function _normalizeDataArray(csvParseResult, csvReadConfig, fillString = '') {
    const maxCols = csvParseResult.data.reduce((prev, curr) => curr.length > prev ? curr.length : prev, 0);
    let someRowWasExpanded = false;
    let firstRealRowExpandedWasFound = false;
    for (let i = 0; i < csvParseResult.data.length; i++) {
        const row = csvParseResult.data[i];
        if (isCommentCell(row[0], csvReadConfig) === false && firstRealRowExpandedWasFound === false) {
            firstRealRowExpandedWasFound = true;
            if (row.length < maxCols && csvParseResult.columnIsQuoted !== null) {
                csvParseResult.columnIsQuoted.push(...Array.from(Array(maxCols - row.length), (p, index) => newColumnQuoteInformationIsQuoted));
            }
        }
        if (row.length < maxCols) {
            row.push(...Array.from(Array(maxCols - row.length), (p, index) => fillString));
            if (row.length > 0 && isCommentCell(row[0], csvReadConfig) === false) {
                someRowWasExpanded = true;
            }
        }
    }
    if (someRowWasExpanded) {
        postSetEditorHasChanges(true);
    }
}
function _getCommentIndices(data, csvReadConfig) {
    if (typeof csvReadConfig.comments !== "string")
        return [];
    let commentIndices = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row.length > 0 && row[0] !== null && isCommentCell(row[0], csvReadConfig)) {
            commentIndices.push(i);
        }
    }
    return commentIndices;
}
function getSpreadsheetColumnLabel(index) {
    return `column ${index + 1}`;
}
function addColumn(selectNewColumn = true) {
    if (!hot)
        throw new Error('table was null');
    const numCols = hot.countCols();
    hot.alter('insert_col', numCols);
    checkIfHasHeaderReadOptionIsAvailable(false);
    const pos = hot.getSelected();
    if (pos && pos.length === 1) {
        if (selectNewColumn) {
            hot.selectCell(pos[0][0], numCols);
        }
    }
}
function addRow(selectNewRow = true) {
    if (!hot)
        throw new Error('table was null');
    const numRows = hot.countRows();
    hot.alter('insert_row', numRows);
    if (selectNewRow) {
        hot.selectCell(numRows, 0);
    }
    checkIfHasHeaderReadOptionIsAvailable(false);
}
function removeRow(index) {
    if (!hot)
        throw new Error('table was null');
    hot.alter('remove_row', index);
    checkIfHasHeaderReadOptionIsAvailable(false);
}
function removeColumn(index) {
    if (!hot)
        throw new Error('table was null');
    hot.alter('remove_col', index);
    checkIfHasHeaderReadOptionIsAvailable(false);
}
function commentValueRenderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    if (value !== null && col === 0 && isCommentCell(value, defaultCsvReadOptions)) {
        if (td && td.nextSibling) {
            td.nextSibling.title = warningTooltipTextWhenCommentRowNotFirstCellIsUsed;
        }
        if (td && td.parentElement) {
            td.parentElement.classList.add('comment-row');
        }
    }
}
Handsontable.renderers.registerRenderer('commentValueRenderer', commentValueRenderer);
function _setOption(targetOptions, options, optionName) {
    if (options.hasOwnProperty(optionName)) {
        if (targetOptions.hasOwnProperty(optionName) === false) {
            _error(`target options object has not property '${optionName}'`);
            return;
        }
        targetOptions[optionName] = options[optionName];
    }
    else {
        _error(`options object has not property '${optionName}'`);
    }
}
function setCsvReadOptionsInitial(options) {
    const keys = Object.keys(defaultCsvReadOptions);
    for (const key of keys) {
        _setOption(defaultCsvReadOptions, options, key);
    }
    const el1 = _getById('delimiter-string');
    el1.value = defaultCsvReadOptions.delimiter;
    const el3 = _getById('has-header');
    el3.checked = defaultCsvReadOptions._hasHeader;
    const el4 = _getById('comment-string');
    el4.value = defaultCsvReadOptions.comments === false ? '' : defaultCsvReadOptions.comments;
    const el5 = _getById('quote-char-string');
    el5.value = defaultCsvReadOptions.quoteChar;
    const el6 = _getById('escape-char-string');
    el6.value = defaultCsvReadOptions.escapeChar;
}
function setCsvWriteOptionsInitial(options) {
    const keys = Object.keys(defaultCsvWriteOptions);
    for (const key of keys) {
        _setOption(defaultCsvWriteOptions, options, key);
    }
    const el1 = _getById('has-header-write');
    el1.checked = defaultCsvWriteOptions.header;
    const el2 = _getById('delimiter-string-write');
    el2.value = defaultCsvWriteOptions.delimiter;
    const el3 = _getById('comment-string-write');
    el3.value = defaultCsvWriteOptions.comments === false ? '' : defaultCsvWriteOptions.comments;
    const el4 = _getById('quote-char-string-write');
    el4.value = defaultCsvWriteOptions.quoteChar;
    const el5 = _getById('escape-char-string-write');
    el5.value = defaultCsvWriteOptions.quoteChar;
    const el6 = _getById('quote-all-fields-write');
    el6.checked = defaultCsvWriteOptions.quoteAllFields;
}
function checkIfHasHeaderReadOptionIsAvailable(isInitialRender) {
    const data = getData();
    const el = _getById('has-header');
    let canSetOption = false;
    if (isInitialRender) {
        canSetOption = data.length > 1;
    }
    else {
        if (defaultCsvReadOptions._hasHeader) {
            canSetOption = data.length >= 1;
        }
        else {
            canSetOption = data.length > 1;
        }
    }
    if (canSetOption) {
        const firstRow = getFirstRowWithIndex();
        if (firstRow === null && !el.checked) {
            canSetOption = false;
        }
    }
    if (canSetOption) {
        el.removeAttribute('disabled');
    }
    else {
        el.setAttribute('disabled', '');
        defaultCsvReadOptions._hasHeader = false;
        el.checked = false;
        return false;
    }
    return true;
}
function throttle(func, wait) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    var later = function () {
        previous = Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout)
            context = args = null;
    };
    return function () {
        var now = Date.now();
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout)
                context = args = null;
        }
        else if (!timeout) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}
function debounce(func, wait, immediate = false) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
    };
}
function _error(text) {
    postVsError(text);
    throw new Error(text);
}
function setupAndApplyInitialConfigPart1(initialConfig) {
    if (initialConfig === undefined) {
        toggleOptionsBar(true);
        showCommentsBtn.style.display = 'none';
        hideCommentsBtn.style.display = 'initial';
        return;
    }
    highlightCsvComments = initialConfig.highlightCsvComments;
    enableWrapping = initialConfig.enableWrapping;
    initialColumnWidth = initialConfig.initialColumnWidth;
    newColumnQuoteInformationIsQuoted = initialConfig.newColumnQuoteInformationIsQuoted;
    fixFirstXRows = Math.max(initialConfig.fixFirstXRows, 0);
    disableBorders = initialConfig.disableBorders;
    if (disableBorders) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `.vscode-dark td, th { border: 0px !important; }`;
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    changeFontSizeInPx(initialConfig.fontSizeInPx);
    const copyReadOptions = Object.assign({}, defaultCsvReadOptions);
    let _readOption_hasHeader = initialConfig.readOption_hasHeader === 'true' ? true : false;
    if (_readOption_hasHeader) {
        isFirstHasHeaderChangedEvent = true;
    }
    else {
        isFirstHasHeaderChangedEvent = false;
    }
    setCsvReadOptionsInitial(Object.assign({}, copyReadOptions, { delimiter: initialConfig.readOption_delimiter, comments: initialConfig.readOption_comment, _hasHeader: _readOption_hasHeader, escapeChar: initialConfig.readOption_escapeChar, quoteChar: initialConfig.readOption_quoteChar }));
    const copyWriteOptions = Object.assign({}, defaultCsvReadOptions);
    setCsvWriteOptionsInitial(Object.assign({}, copyWriteOptions, { comments: initialConfig.writeOption_comment, delimiter: initialConfig.writeOption_delimiter, header: initialConfig.writeOption_hasHeader === 'true' ? true : false, escapeChar: initialConfig.writeOption_escapeChar, quoteChar: initialConfig.writeOption_quoteChar, quoteAllFields: initialConfig.quoteAllFields, retainQuoteInformation: initialConfig.retainQuoteInformation }));
    switch (initialConfig.optionsBarAppearance) {
        case 'expanded': {
            toggleOptionsBar(false);
            break;
        }
        case 'collapsed': {
            toggleOptionsBar(true);
            break;
        }
        default: {
            _error(`unknown optionsBarAppearance: ${initialConfig.optionsBarAppearance}`);
            notExhaustiveSwitch(initialConfig.optionsBarAppearance);
            break;
        }
    }
    if (initialConfig.initiallyHideComments) {
        showCommentsBtn.style.display = 'initial';
        hideCommentsBtn.style.display = 'none';
    }
    else {
        showCommentsBtn.style.display = 'none';
        hideCommentsBtn.style.display = 'initial';
    }
}
function _getVsState() {
    if (!vscode)
        return _createDefaultVsState();
    const state = vscode.getState();
    if (!state)
        return _createDefaultVsState();
    return state;
}
function _createDefaultVsState() {
    return {
        previewIsCollapsed: true,
        readOptionIsCollapsed: true,
        writeOptionIsCollapsed: true
    };
}
function _setReadOptionCollapsedVsState(isCollapsed) {
    if (vscode) {
    }
}
function _setWriteOptionCollapsedVsState(isCollapsed) {
    if (vscode) {
    }
}
function _setPreviewCollapsedVsState(isCollapsed) {
    if (vscode) {
    }
}
function customSearchMethod(query, value) {
    if (query === null || query === undefined || value === null || value === undefined)
        return false;
    if (query === '')
        return false;
    if (!findWidgetInstance.findOptionMatchCaseCache) {
        value = value.toLowerCase();
        query = query.toLowerCase();
    }
    if (findWidgetInstance.findOptionTrimCellCache) {
        value = value.trim();
    }
    if (findWidgetInstance.findOptionUseRegexCache) {
        if (findWidgetInstance.findWidgetCurrRegex === null) {
            throw new Error('should not happen...');
        }
        let result = findWidgetInstance.findWidgetCurrRegex.exec(value);
        if (findWidgetInstance.findOptionMatchWholeCellCache) {
            if (result !== null && result.length > 0) {
                return result[0] === value;
            }
        }
        return result !== null;
    }
    else {
        if (findWidgetInstance.findOptionMatchWholeCellCache) {
            return value === query;
        }
        return value.indexOf(query) !== -1;
    }
}
//# sourceMappingURL=util.js.map