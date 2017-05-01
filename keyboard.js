//***********************************************************************************
//*                                                                                 *
//*            MOK Project - Multilingual Onscreen Keyboard                         *
//*                                                                                 *
//*            Author: Sean McQuay (www.seanmcquay.com)                             *
//*                                                                                 *
//*            GitHub: https://github.com/srm985/mok-project                        *
//*                                                                                 *
//*            Started: March 2017                                                  *
//*            Version: 0                                                           *
//*                                                                                 *
//*            License: MIT (https://opensource.org/licenses/MIT)                   *
//*                                                                                 *
//***********************************************************************************

$.fn.keyboard = function(options) {

    var keyMap = { '29': 0, '02': 1, '03': 2, '04': 3, '05': 4, '06': 5, '07': 6, '08': 7, '09': 8, '0a': 9, '0b': 10, '0c': 11, '0d': 12, '10': 13, '11': 14, '12': 15, '13': 16, '14': 17, '15': 18, '16': 19, '17': 20, '18': 21, '19': 22, '1a': 23, '1b': 24, '2b': 25, '1e': 26, '1f': 27, '20': 28, '21': 29, '22': 30, '23': 31, '24': 32, '25': 33, '26': 34, '27': 35, '28': 36, '2c': 37, '2d': 38, '2e': 39, '2f': 40, '30': 41, '31': 42, '32': 43, '33': 44, '34': 45, '35': 46 },
        keyStatusObject = { shift: false, caps: false, altgrp: false, shift_altgrp: '' },
        pageElement = $(this),
        focusedInputField,
        languageList,
        resizeTimerActive = false,
        languageArrayPosition,
        shiftStateObject,
        deadkeyObject,
        ligatureObject,
        deadkeyPressed = '',
        deadkeySet = false,
        textFlowDirection = 'LTR',
        keyboardOpen = false;

    //*****Find all of our default options defined here.*****
    options = {
        language: typeof(options.language) === 'undefined' ? 'english' : options.language,
        keyColor: typeof(options.keyColor) === 'undefined' ? '#E0E0E0' : options.keyColor,
        keyTextColor: typeof(options.keyTextColor) === 'undefined' ? '#555555' : options.keyTextColor,
        capsLightColor: typeof(options.capsLightColor) === 'undefined' ? '#3498DB' : options.capsLightColor,
        enterKey: typeof(options.enterKey) === 'undefined' ? '' : options.enterKey,
        tabKey: typeof(options.tabKey) === 'undefined' ? '' : options.tabKey,
        ctrlKey: typeof(options.ctrlKey) === 'undefined' ? '' : options.ctrlKey,
        altKey: typeof(options.altKey) === 'undefined' ? '' : options.altKey,
        spareKey: typeof(options.spareKey) === 'undefined' ? '' : options.spareKey,
        languageKey: typeof(options.languageKey) === 'undefined' ? '' : options.languageKey,
        keyboardPosition: typeof(options.keyboardPosition) === 'undefined' ? 'bottom' : options.keyboardPosition,
        inputType: setInputType(options.inputType),
        cancelColor: typeof(options.cancelColor) === 'undefined' ? '#E74C3C' : options.cancelColor,
        cancelTextColor: typeof(options.cancelTextColor) === 'undefined' ? '#FFFFFF' : options.cancelTextColor,
        acceptColor: typeof(options.acceptColor) === 'undefined' ? '#2ECC71' : options.acceptColor,
        acceptTextColor: typeof(options.acceptTextColor) === 'undefined' ? '#FFFFFF' : options.acceptTextColor,
        blackoutColor: typeof(options.blackoutColor) === 'undefined' ? '25, 25, 25, 0.9' : options.blackoutColor,
        allowEscapeCancel: typeof(options.allowEscapeCancel) === 'undefined' ? true : options.allowEscapeCancel,
        allowEnterAccept: typeof(options.allowEnterAccept) === 'undefined' ? true : options.allowEnterAccept,
    };

    //*****Quick cleanup of our language array.*****
    options.language = options.language.split(',');
    $.each(options.language, function(i, val) {
        options.language[i] = val.trim();
    });

    //***********************************************************************************
    //*             Return our selected input types as a formatted string.              *
    //***********************************************************************************
    function setInputType(inputType) {
        var inputTypeArray = new Array(),
            formattedString = '';

        if (inputType !== undefined && inputType != '') {
            inputTypeArray = inputType.trim().split(',');
            $.each(inputTypeArray, function(i, value) {
                if (value.trim().toString() == 'contenteditable') {
                    formattedString += '[contenteditable="true"], ';
                } else if (value.trim().toString() == 'textarea') {
                    formattedString += 'textarea, ';
                } else {
                    formattedString += 'input[type="' + value.trim().toString() + '"], ';
                }
            });
            formattedString = formattedString.slice(0, -2);
        } else {
            formattedString = 'input[type="text"], input[type="number"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], textarea, [contenteditable="true"]';
        }
        return (formattedString);
    }

    init();

    function init() {
        var inputFieldLabel = '';

        languageArrayPosition = 0;

        readKeyboardFile(options.language[languageArrayPosition]);

        //*****Add our event listeners once everything has been materialized.*****
        pageElement.on('focus click touch', options.inputType, function() {
            if ($(this).prop('class') != 'keyboard-input-field') {
                focusedInputField = $(this);
                if (focusedInputField.is('input')) {
                    $('.keyboard-input-field').val(focusedInputField.val());
                    $('.keyboard-input-field').prop('type', focusedInputField.prop('type'));
                } else {
                    $('.keyboard-input-field').val(focusedInputField.html());
                    $('.keyboard-input-field').prop('type', 'text');
                }
                $('.keyboard-blackout-background').show();
                $('.keyboard-wrapper').show();
                keyboardOpen = true;
                $('.keyboard-input-field').focus();
            }
        });

        //*****Listen for keypresses.*****
        $(document).on('click touch', '.keyboard-key', function() {
            var keyRegistered = $(this).data('keyval');
            if ($('.keyboard-input-field').prop('type') != 'tel' && $('.keyboard-input-field').prop('type') != 'number') {
                handleKeypress(keyRegistered);
            } else if (($('.keyboard-input-field').prop('type') == 'tel' || $('.keyboard-input-field').prop('type') == 'number') && (keyRegistered.match(/\d/) || (keyRegistered.length > 2))) {
                handleKeypress(keyRegistered);
            }
        });

        //*****Handle our keyboard close button.*****
        $(document).on('click touch', '.keyboard-cancel-button', function() {
            discardData();
        });

        //*****Handle our keyboard accept button.*****
        $(document).on('click touch', '.keyboard-accept-button', function() {
            acceptData();
        });

        //*****Provide a little functionality during external keyboard testing.*****
        $(document).on('keydown', function(e) {
            keyCodeStored = e.which;
            hardwareKeypress(e);
        });
    }

    function hardwareKeypress(key) {
        if ($('.keyboard-wrapper').is(':visible')) {
            switch (key.which) {
                case 13:
                    if (options.allowEnterAccept) {
                        acceptData();
                        key.preventDefault();
                    }
                    break;
                case 27:
                    if (options.allowEscapeCancel) {
                        discardData();
                        key.preventDefault();
                    }
                    break;
            }

        }
    }

    //***********************************************************************************
    //*         Read our keyboard file and parse information into usable tables         *
    //***********************************************************************************
    function readKeyboardFile(file) {
        var keyData,
            shiftStateData,
            shiftStateLocation = '',
            deadkeyData,
            deadkeyLocation = '',
            ligatureData,
            ligatureLocation = '',
            tempArr = new Array(),
            tempObject;

        shiftStateObject = '';
        deadkeyObject = '';
        ligatureObject = '';

        $.get('languages/' + file + '.klc', function(data) {

            //*****Extract our keyboard key data.*****
            //keyData = data.match(/[0-9][\w]?(\t|\s)\w+(\t|\s)[(\t|\s)]?\w+(\t|\s)([-]?\w+|%%)[@]?(\t|\s)([-]?\w+|%%)[@]?(\t|\s)([-]?\w+|%%)[@]?((\t|\s)([-]?\w+|%%)[@]?)?((\t|\s)([-]?\w+|%%)[@]?)?((\t|\s)([-]?\w+|%%)[@]?)?(\t|\s)(\t|\s)?\/\//g);
            data = data.replace(/\u0000/g, '');
            keyData = data.match(/\d(\w)?\s+\w+\s+\d\s+(-1|\w+@?|%%)\s+(-1|\w+@?|%%)\s+(-1|\w+@?|%%)(\s+(-1|\w+@?|%%))?(\s+(-1|\w+@?|%%))?(\s+(-1|\w+@?|%%))?\s+\/\//g);

            //*****Extract our shift state data and convert to lookup table.*****
            shiftStateLocation = data.indexOf('SHIFTSTATE');
            if (shiftStateLocation > 0) {
                shiftStateData = data.slice(shiftStateLocation, data.indexOf('LAYOUT')).trim().split(/\n/g);
                shiftStateData.splice(0, 2);
                $.each(shiftStateData, function(i, value) {
                    if (value.indexOf(':') == -1) {
                        shiftStateObject += '"default": ';
                    } else if (value.indexOf('Shft  Ctrl Alt') != -1) {
                        shiftStateObject += '"shift_altgrp": ';
                    } else if (value.indexOf('Shft  Ctrl') != -1) {
                        shiftStateObject += '"ctrl_shift": ';
                    } else if (value.indexOf('Ctrl Alt') != -1) {
                        shiftStateObject += '"altgrp": ';
                    } else if (value.indexOf('Ctrl') != -1) {
                        shiftStateObject += '"ctrl": ';
                    } else if (value.indexOf('Shft') != -1) {
                        shiftStateObject += '"shift": ';
                    }
                    //shiftStateObject += value.match(/\w{6} [0-9]/).toString().slice(-1) + ', ';
                    shiftStateObject += value.match(/\w{6}\s[0-9]/).toString().slice(-1) + ', ';
                });
                shiftStateObject = JSON.parse('{' + shiftStateObject.toString().slice(0, -2) + '}');
            }

            //*****Extract our deadkey data and convert to lookup table.*****
            deadkeyLocation = data.indexOf('DEADKEY');
            if (deadkeyLocation > 0) {
                deadkeyData = data.slice(deadkeyLocation, data.indexOf('KEYNAME')).trim().split('DEADKEY');
                deadkeyData.splice(0, 1);
                $.each(deadkeyData, function(i, value) {
                    tempArr = value.split(/\n/g);
                    tempArr.splice(0, 2);
                    tempObject = '';
                    $.each(tempArr, function(_i, _value) {
                        tempObject += '"' + _value.trim().slice(0, 4) + '": "' + _value.trim().slice(5, 9) + '", ';
                    });
                    tempObject = '{' + tempObject.slice(0, -2) + '}';
                    deadkeyObject += '"' + value.trim().slice(0, 4) + '": ' + tempObject + ', ';
                });
                deadkeyObject = JSON.parse('{' + deadkeyObject.slice(0, -2) + '}');
            }

            //*****Extract our ligature-generated keys and convert to lookup table.*****
            ligatureLocation = data.indexOf('LIGATURE');
            if (ligatureLocation > 0) {
                ligatureData = data.slice(ligatureLocation, data.indexOf('KEYNAME')).trim().split(/\n/g);
                ligatureData.splice(0, 5);
                $.each(ligatureData, function(i, value) {
                    if (value.indexOf('//') > 0) {
                        ligatureData[i] = value.trim().split('//')[0].trim().replace(/\t/g, ' ').replace('  ', ' ').replace('  ', ' ').split(' ');
                        ligatureData[i].splice(1, 1);
                        ligatureObject += '"' + ligatureData[i][0] + '": ';
                        ligatureData[i].splice(0, 1);
                        $.each(ligatureData[i], function(j, _value) {
                            ligatureData[i][j] = '"' + _value + '"';
                        });
                        ligatureObject += '[' + ligatureData[i] + '], ';
                    }
                });
                ligatureObject = JSON.parse('{' + ligatureObject.slice(0, -2) + '}');
            }

            //*****Reverse input direction for specific languages.*****
            if (file == 'arabic') {
                textFlowDirection = 'RTL';
            } else {
                textFlowDirection = 'LTR';
            }

            materializeKeyboard(keyData);
        });
    }

    //***********************************************************************************
    //*            This function handles the main buildout of our keyboard.             *
    //***********************************************************************************
    function materializeKeyboard(keyListString) {
        var keyList = keyListString.toString().split(','),
            keyObject = new Array(),
            keyMapArray = new Array(47);

        $.each(keyList, function(i, value) {
            //keyObject[i] = value.toString().split(/\u0009+/g);
            keyObject[i] = value.toString().replace(/(\t+|\s+)/g, ' ');
            keyObject[i] = keyObject[i].split(' ');
            if (keyMap[keyObject[i][0]] !== undefined) {
                keyMapArray[keyMap[keyObject[i][0]]] = keyObject[i];
            }
        });

        if ($('.keyboard-wrapper').length) {
            destroyKeys();
            keyboardWrapperPresent = true;
        } else {
            $('body').prepend('<div class="keyboard-blackout-background"></div><div class="keyboard-wrapper"></div>');
            keyboardWrapperPresent = false;
        }

        generateRow(keyMapArray.slice(0, 13));
        generateRow(keyMapArray.slice(13, 26));
        generateRow(keyMapArray.slice(26, 37));
        generateRow(keyMapArray.slice(37, 47));

        setKeys('default');
        keyboardFillout();
        sizeKeys();
        keyboardAttributes();

        if (!keyboardOpen) {
            $('.keyboard-blackout-background').hide();
            $('.keyboard-wrapper').hide();
        }
    }

    //***********************************************************************************
    //*                    Append each key's individual object.                         *
    //***********************************************************************************
    function appendKey(keyObject) {
        $('.keyboard-row:last').append('<button class="keyboard-key keyboard-key-sm"></button>');
        $('.keyboard-key:last').data('keyDataObject', keyObject);
    }

    //***********************************************************************************
    //*                    Create row wrapper and fill with keys.                       *
    //***********************************************************************************
    function generateRow(keyListSplit) {
        var keyObject, capsValue;
        $('.keyboard-wrapper').append('<div class="keyboard-row"></div>');
        $.each(keyListSplit, function(i, value) {
            if (value !== undefined) {
                //keyObject = { default: (value[3] == '//' || value[3] == '-1' || value[3] === undefined) ? '-1' : value[3], shift: (value[4] == '//' || value[4] == '-1' || value[4] === undefined) ? '-1' : value[4], altgrp: (value[6] == '//' || value[6] == '-1' || value[6] === undefined) ? '-1' : value[6], shift_altgrp: (value[7] == '//' || value[7] == '-1' || value[7] === undefined) ? '-1' : value[7] };
                keyObject = { default: determineKey(value[shiftStateObject.default-1], value[1]), shift: determineKey(value[shiftStateObject.shift - 1], value[1]), altgrp: determineKey(value[shiftStateObject.altgrp - 1], value[1]), shift_altgrp: determineKey(value[shiftStateObject.shift_altgrp - 1], value[1]) };
            } else {
                keyObject = { default: '-1', shift: '-1', altgrp: '-1', shift_altgrp: '-1' };
            }
            appendKey(keyObject);
        });
    }

    //***********************************************************************************
    //*                 Sort out deadkeys, ligature, and undefined.                     *
    //***********************************************************************************
    function determineKey(keyValue, VK) {
        var returnKey = keyValue;

        if (keyValue == '%%') {
            returnKey = ligatureObject[VK];
        } else if (keyValue === undefined) {
            returnKey = '-1';
        }

        return returnKey;
    }

    //***********************************************************************************
    //*      Append our extra function keys that we didn't get from the .klc file.      *
    //***********************************************************************************
    function keyboardFillout() {
        if (!$('.keyboard-action-wrapper').length) {
            $('.keyboard-wrapper').prepend('<div class="keyboard-action-wrapper"><button class="keyboard-action-button keyboard-cancel-button">Cancel</button><input type="text" class="keyboard-input-field"><button class="keyboard-action-button keyboard-accept-button">Accept</button></div>');
        }
        $('.keyboard-row:eq(0)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="backspace">Backspace</button>');
        $('.keyboard-row:eq(1)').prepend('<button class="keyboard-key keyboard-key-lg" data-keyval="tab">Tab</button>');
        $('.keyboard-row:eq(2)').prepend('<button class="keyboard-key keyboard-key-lg caps-lock-key" data-keyval="caps lock">Caps Lock</button>');
        $('.keyboard-row:eq(2)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="enter">Enter</button>');
        $('.keyboard-row:eq(3)').prepend('<button class="keyboard-key keyboard-key-lg" data-keyval="shift">Shift</button>');
        $('.keyboard-row:eq(3)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="shift">Shift</button>');
        $('.keyboard-wrapper').append('<div class="keyboard-row"></div>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="ctrl">Ctrl</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="language">Language</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="alt">Alt</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-xl" data-keyval="space">&nbsp;</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="alt grp">Alt Grp</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="spare">&nbsp;</button>');
        $('.keyboard-row:eq(4)').append('<button class="keyboard-key keyboard-key-lg" data-keyval="ctrl">Ctrl</button>');
    }

    //***********************************************************************************
    //*              Adjust sizing of keys based on our enabled options.                *
    //***********************************************************************************
    function sizeKeys() {
        var rowWidth = $('.keyboard-row').width(),
            maxKeyCount = 15,
            keyPadding = 2 * ($('.keyboard-key').css('margin-right')).match(/[0-9]/),
            smallKeys,
            largeKeys,
            xlargeKeys,
            smallKeyWidth = (rowWidth - (maxKeyCount * keyPadding)) / maxKeyCount,
            largeKeyWidth,
            xlargeKeyWidth = rowWidth / 3;

        $('.keyboard-row').each(function() {
            smallKeys = $(this).children('.keyboard-key-sm').length;
            largeKeys = $(this).children('.keyboard-key-lg').length;
            xlargeKeys = $(this).children('.keyboard-key-xl').length;
            largeKeyWidth = (rowWidth - ((smallKeys + largeKeys + xlargeKeys) * keyPadding) - (smallKeys * smallKeyWidth) - (xlargeKeys * xlargeKeyWidth)) / largeKeys;
            $(this).children('.keyboard-key-sm').width(smallKeyWidth);
            $(this).children('.keyboard-key-lg').width(largeKeyWidth);
            $(this).children('.keyboard-key-xl').width(xlargeKeyWidth);
        });
    }

    //***********************************************************************************
    //*                Cycle key values based on depressed function keys.               *
    //***********************************************************************************
    function setKeys(keyType) {
        var currentKey,
            keyObject,
            tempString = '';

        //*****Set keyboard to default and capitalize letters.*****
        if (keyStatusObject.caps && !keyStatusObject.shift && !keyStatusObject.altgrp) {
            keyType = 'default';
            $('.caps-lock-key').addClass('caps-lock-key-active');
        } else if (!keyStatusObject.caps && !keyStatusObject.shift && !keyStatusObject.altgrp) {
            keyType = 'default';
        }

        if (!keyStatusObject.caps) {
            $('.caps-lock-key').removeClass('caps-lock-key-active');
        }

        //*****If we didn't just press [Shift] + [Alt Grp], clear our tracker.*****
        if (keyStatusObject.shift_altgrp != '' && keyType != 'shift_altgrp') {
            keyStatusObject.shift_altgrp = '';
        }

        $('.keyboard-key').each(function() {
            tempString = '';
            try {
                currentKey = $(this)
                keyObject = currentKey.data('keyDataObject');
                if (keyObject[keyType].length == 4) {
                    currentKey.html('&#x' + keyObject[keyType] + ';');
                    currentKey.data('keyval', currentKey.html());
                } else if (keyObject[keyType].length == 5 && keyObject[keyType].match('@')) {
                    currentKey.html('&#x' + keyObject[keyType].replace('@', '') + ';');
                    currentKey.data('keyval', currentKey.html());
                } else if (keyObject[keyType].constructor === Array) {
                    $.each(keyObject[keyType], function(i, value) {
                        tempString += '&#x' + value + ';';
                    });
                    currentKey.html(tempString);
                    currentKey.data('keyval', currentKey.html());
                } else if (keyObject[keyType] == '-1' || keyObject[keyType] == '%%' || keyObject[keyType].length == 0) {
                    currentKey.html('&nbsp;');
                    currentKey.data('keyval', '');
                } else {
                    currentKey.html(keyObject[keyType]);
                    currentKey.data('keyval', currentKey.html());
                }

                if (!keyStatusObject.shift && keyStatusObject.caps && !keyStatusObject.altgrp) {
                    currentKey.html(currentKey.html().length == 1 ? currentKey.html().toUpperCase() : currentKey.html());
                    currentKey.data('keyval', currentKey.html().length == 1 ? currentKey.html() : currentKey.data('keyval'));
                }
            } catch (err) {
                //
            }

        });
    }

    //***********************************************************************************
    //*     Read and subsequently write our depressed key to the appropriate form.      *
    //***********************************************************************************
    function handleKeypress(keyPressed) {
        //*****Convert deadkey to hex and pad with zeros to ensure it's four digits.*****
        var deadkeyLookup = ('0000' + keyPressed.charCodeAt(0).toString(16)).slice(-4),
            caretPosition = $('.keyboard-input-field')[0].selectionStart;

        keyPressed = keyPressed.replace('&lt;', '<').replace('&gt;', '>').replace(/\bspace/, ' '); //Acount for &lt; and &gt; escaping.

        if (keyPressed.length > 2) {
            deadkeyPressed = '';
            switch (keyPressed) {
                case 'shift':
                    keyStatusObject.shift = keyStatusObject.shift ? false : true;
                    keyStatusObject.caps = false;
                    keyStatusObject.altgrp = false;
                    if (keyStatusObject.shift_altgrp == 'altgrp') {
                        setKeys('shift_altgrp');
                        keyStatusObject.shift_altgrp = '';
                    } else if (keyStatusObject.shift_altgrp == 'shift') {
                        setKeys('shift');
                        keyStatusObject.shift_altgrp = '';
                    } else {
                        setKeys('shift');
                        keyStatusObject.shift_altgrp = 'shift';
                    }
                    break;
                case 'caps lock':
                    keyStatusObject.shift = false;
                    keyStatusObject.caps = keyStatusObject.caps ? false : true;
                    keyStatusObject.altgrp = false;
                    setKeys('caps');
                    break;
                case 'alt grp':
                    keyStatusObject.shift = false;
                    keyStatusObject.caps = false;
                    keyStatusObject.altgrp = keyStatusObject.altgrp ? false : true;
                    if (keyStatusObject.shift_altgrp == 'shift') {
                        setKeys('shift_altgrp');
                        keyStatusObject.shift_altgrp = '';
                    } else if (keyStatusObject.shift_altgrp == 'altgrp') {
                        setKeys('altgrp');
                        keyStatusObject.shift_altgrp = '';
                    } else {
                        setKeys('altgrp');
                        keyStatusObject.shift_altgrp = 'altgrp';
                    }
                    break;
                case 'backspace':
                    $('.keyboard-input-field').val($('.keyboard-input-field').val().slice(0, caretPosition - 1) + $('.keyboard-input-field').val().slice(caretPosition));
                    caretPosition -= 1;
                    $('.keyboard-input-field').focus();
                    $('.keyboard-input-field')[0].selectionStart = caretPosition;
                    $('.keyboard-input-field')[0].selectionEnd = caretPosition;
                    break;
                case 'space':
                    //Handled by replacement function above.
                    break;
                case 'enter':
                    //User-definable callback.
                    if (options.enterKey && typeof(options.enterKey) === 'function') {
                        options.enterKey();
                    }
                    break;
                case 'tab':
                    //User-definable callback.
                    if (options.tabKey && typeof(options.tabKey) === 'function') {
                        options.tabKey();
                    }
                    break;
                case 'ctrl':
                    //User-definable callback.
                    if (options.ctrlKey && typeof(options.ctrlKey) === 'function') {
                        options.ctrlKey();
                    }
                    break;
                case 'alt':
                    //User-definable callback.
                    if (options.altKey && typeof(options.altKey) === 'function') {
                        options.altKey();
                    }
                    break;
                case 'language':
                    if (languageArrayPosition + 1 <= options.language.length - 1) {
                        languageArrayPosition++;
                    } else {
                        languageArrayPosition = 0;
                    }
                    clearKeyboardState();
                    readKeyboardFile(options.language[languageArrayPosition]);
                    //User-definable callback.
                    if (options.languageKey && typeof(options.languageKey) === 'function') {
                        options.languageKey();
                    }
                    break;
                case 'spare':
                    //User-definable callback.
                    if (options.spareKey && typeof(options.spareKey) === 'function') {
                        optionsspareKey();
                    }
                    break;
            }
        } else {
            keyStatusObject.shift = false;
            keyStatusObject.altgrp = false;
            setKeys('default');
            deadkeyPressed = deadkeyObject[deadkeyLookup];
            if (deadkeyPressed || deadkeySet) {
                keyPressed = '';
                if (deadkeyPressed === undefined && deadkeySet) {
                    var combinedKey = String.fromCharCode('0x' + deadkeySet[deadkeyLookup]);
                    if (combinedKey && deadkeySet[deadkeyLookup] !== undefined) {
                        keyPressed = combinedKey;
                    }
                }
                deadkeySet = deadkeyPressed;
            }

            //*****Write key value and update input attributes.*****
            $('.keyboard-input-field').attr('dir', textFlowDirection);
            $('.keyboard-input-field').val($('.keyboard-input-field').val().slice(0, caretPosition) + keyPressed + $('.keyboard-input-field').val().slice(caretPosition));
            //*****Return focus and update caret position.*****
            caretPosition += keyPressed.length;
            $('.keyboard-input-field').focus();
            $('.keyboard-input-field')[0].selectionStart = caretPosition;
            $('.keyboard-input-field')[0].selectionEnd = caretPosition;
        }
    }

    //***********************************************************************************
    //*                       Discard keyboard data and close.                          *
    //***********************************************************************************
    function discardData() {
        $('.keyboard-input-field').val('');
        $('.keyboard-wrapper').hide();
        $('.keyboard-blackout-background').hide();
        clearKeyboardState();
        keyboardOpen = false;
    }

    //***********************************************************************************
    //*                   Submit keyboard data to form and close.                       *
    //***********************************************************************************
    function acceptData() {
        if (focusedInputField.is('input')) {
            focusedInputField.val($('.keyboard-input-field').val());
        } else {
            focusedInputField.html($('.keyboard-input-field').val());
        }
        $('.keyboard-input-field').val('');
        $('.keyboard-wrapper').hide();
        $('.keyboard-blackout-background').hide();
        clearKeyboardState();
        keyboardOpen = false;
    }

    //***********************************************************************************
    //*                Provide some styling options for our keyboard.                   *
    //***********************************************************************************
    function keyboardAttributes() {
        var viewportWidth = $(window).width(),
            viewportHeight = $(window).height(),
            keyboardHeight = $('.keyboard-wrapper').height(),
            keyboardWidth = $('.keyboard-wrapper').width();
        $('.keyboard-key').css('background-color', options.keyColor);
        $('.keyboard-key').css('color', options.keyTextColor);
        $('.keyboard-cancel-button').css('background-color', options.cancelColor);
        $('.keyboard-cancel-button').css('color', options.cancelTextColor);
        $('.keyboard-accept-button').css('background-color', options.acceptColor);
        $('.keyboard-accept-button').css('color', options.acceptTextColor);
        $('.keyboard-blackout-background').css('background-color', 'rgba(' + options.blackoutColor + ')');
        switch (options.keyboardPosition) {
            case 'top':
                $('.keyboard-wrapper').css('top', '20px');
                break;
            case 'middle':
                $('.keyboard-wrapper').css('top', ((viewportHeight - keyboardHeight) / 2).toString() + 'px');
                break;
            default:
                $('.keyboard-wrapper').css('bottom', '20px');
        }
        $('.keyboard-wrapper').css('left', ((viewportWidth - keyboardWidth) / 2).toString() + 'px');
    }

    //***********************************************************************************
    //*                    Strip our keyboard element from page.                        *
    //***********************************************************************************
    function destroyKeyboard() {
        clearKeyboardState();
        $('.keyboard-wrapper').remove();
    }

    //***********************************************************************************
    //*                      Strip keys from keyboard element.                          *
    //***********************************************************************************
    function destroyKeys() {
        clearKeyboardState();
        $('.keyboard-row').remove();
    }

    //***********************************************************************************
    //*                  Reset all of our keyboard function keys.                       *
    //***********************************************************************************
    function clearKeyboardState() {
        for (var property in keyStatusObject) {
            if (keyStatusObject.hasOwnProperty(property)) {
                keyStatusObject[property] = false;
            }
        }
    }

    //***********************************************************************************
    //*                         Listen for window resizing.                             *
    //***********************************************************************************
    $(window).resize(function() {
        //*****Prevent multiple function calls.*****
        if (!resizeTimerActive) {
            resizeTimerActive = true;
            var resizeDelay = setTimeout(function() {
                init();
                resizeTimerActive = false;
            }, 500);
        }
    });
}
