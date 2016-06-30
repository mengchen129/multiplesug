/**
 * Suggestion-Multiple 组件
 * @author mengchen
 * @version 0.1
 */
(function(root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(this ,function($) {
    "use strict";

    if (!$) {
        throw new Error('Please check your jQuery import.');
    }

    function getRandomId() {
        return Date.now() + '-' + parseInt(Math.random() * 1000);
    }

    function debounce(fun, timeout) {
        var timer = null;
        var slice = Array.prototype.slice;
        return function() {
            var args = slice.call(arguments);
            var ctx = this;

            if (timer) {
                clearTimeout(timer);
            }

            timer = setTimeout(function() {
                fun.apply(ctx, args);
            }, timeout);
        };
    }

    function buildSug($div, id, selectName, placeholder) {
        $div.css({'overflow': 'hidden'});
        $div.html('<div class="sug-wrap" id="sug-wrap-' + id +'">\
                        <div class="sug-selected">\
                            <span class="sug-copy" title="点击复制已选数据">&copy;</span>\
                        </div>\
                        <div class="sug-input-wrap">\
                            <input type="text" class="sug-input" placeholder="' + placeholder + '" autocomplete="off">\
                        </div>\
                        <select name="' + selectName + '" multiple="multiple" style="display: none;"></select>\
                    </div>\
                    <div class="suggestion-list"></div>\
                    <div class="sug-info-tip"></div>');
        return $('#sug-wrap-' + id);
    }

    function buildSugList(items, $sugList) {
        var mainContent = '';
        if (!items.length) {
            mainContent = '<li class="suggestion-item-empty"><span class="sug-text-muted">No Suggestion</span></li>';
        } else {
            items.forEach(function(item) {
                mainContent += '<li class="suggestion-item" data-sug-key="' + item.key + '">' + item.title + '</li>';
            });
        }

        var template = '<div class="suggestion-container"><ul>' + mainContent + '</ul></div>';
        $sugList.html(template);
    }

    function loadSelectOptions($select, options) {
        var optionsHtml = '';
        options = options || {};
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                optionsHtml += '<option value="' + key + '" selected>' + options[key] + '</option>';
            }
        }
        $select.html(optionsHtml);
    }

    var defaults = {
        keyParamName: 'key',
        limitParamName: 'limit',
        limit: 5,
        timeout: 300,
        maxSelected: 10000
    };

    var constants = {
        STORAGE_KEY: 'MULTIPLE_SUG_ITEMS_DATA'
    };

    var ls = window.localStorage;

    $.fn.multiplesug = function(params) {

        var selectedItems = {};

        if (!(this.length && this[0].tagName.toUpperCase() === 'DIV')) {
            throw new Error('Init element must be an <div>.');
        }

        params = params || {};
        var loadDataUrl = params.url;
        var keyParamName = params.keyParamName || defaults.keyParamName;
        var limitParamName = params.limitParamName || defaults.limitParamName;
        var limit = params.limit || defaults.limit;
        var timeout = params.timeout || defaults.timeout;
        var jsonReader = params.jsonReader || function(data) {return data};
        var maxSelected = params.maxSelected || defaults.maxSelected;
        var name = params.name || '';
        var placeholder = params.placeholder || '';

        var $sugWrap = buildSug($(this), getRandomId(), name, placeholder),
            $sugSelected = $sugWrap.find('.sug-selected'),
            $sugInputWrap = $sugWrap.find('.sug-input-wrap'),
            $sugInput = $sugWrap.find('.sug-input'),
            $sugList = $sugWrap.next('.suggestion-list'),
            $select = $sugWrap.find('select'),
            $sugCopy = $sugWrap.find('.sug-copy'),
            $sugInfoTip = $sugWrap.nextAll('.sug-info-tip');

        var initData = params.initData || {};
        for (var key in initData) {
            if (initData.hasOwnProperty(key)) {
                appendItem(key, initData[key]);
            }
        }

        // 针对中文输入法词组输入完成前加锁,不执行查询
        var compositionLock = false;

        // sug列表是否触发了mousedown事件
        var itemMousedown = false;

        function suggestionRequest() {
            if (compositionLock) {
                return;
            }
            var keyword = $sugInput.val();
            if (!keyword) {
                return;
            }

            var params = {};
            params[keyParamName] = keyword;
            params[limitParamName] = limit;

            $.getJSON(loadDataUrl, params, function(result) {
                var data = jsonReader(result);
                buildSugList(data, $sugList);
                var inputElem = $sugInput.get(0);
                $sugList.css({
                    width: inputElem.offsetWidth,
                    left: inputElem.offsetLeft,
                    top: inputElem.offsetTop + inputElem.offsetHeight
                }).show();
            });
        }

        function appendItem(itemKey, itemTitle) {
            if (itemKey in selectedItems) {
                return false;
            }
            if (Object.keys(selectedItems).length >= maxSelected) {
                return false;
            }
            $sugSelected.append('<span class="sug-selected-item" data-key="' + itemKey + '">' + itemTitle + ' <span class="sug-remove">&times;</span></span>');
            selectedItems[itemKey] = itemTitle;
            $sugWrap.data('selected-items', selectedItems);
            loadSelectOptions($select, selectedItems);
            checkMaxSelected();
            return true;
        }

        /**
         * 当已选数据为最大值时, 隐藏输入框
         * 当未选择任何数据时, 不展示复制按钮
         */
        function checkMaxSelected() {
            $sugInputWrap[(Object.keys(selectedItems).length >= maxSelected) ? 'hide' : 'show']();
            $sugCopy[Object.keys(selectedItems).length > 0 ? 'show' : 'hide']();
        }

        $sugInput.bind('blur', function() {
            if (!itemMousedown) {
                $sugList.hide();
            }
        }).bind('compositionstart', function() { compositionLock = true; })
            .bind('compositionend', function() { compositionLock = false; })
            .bind('input', debounce(suggestionRequest, timeout))
            .bind('keydown', function(event) {
                var $selectedItem = $sugList.find("li.selected");
                if (event.keyCode === 40) { // 下
                    if ($selectedItem.length) {
                        if ($selectedItem.next().length) {
                            $selectedItem.removeClass('selected').next().addClass('selected');
                        }
                    } else {
                        $sugList.find("li:first").addClass('selected');
                    }
                } else if (event.keyCode === 38) { // 上
                    if ($selectedItem.length) {
                        if ($selectedItem.prev().length) {
                            $selectedItem.removeClass('selected').prev().addClass('selected');
                        }
                    } else {
                        $sugList.find("li:last").addClass('selected');
                    }
                } else if (event.keyCode === 13) { // 回车
                    if ($selectedItem.length) {
                        appendItem($selectedItem.data('sug-key'), $selectedItem.text());
                        $sugInput.val('').focus();
                        $sugList.hide();
                    }
                    return false;
                }
            });

        $sugList.delegate('li.suggestion-item', 'mousedown', function() {
            itemMousedown = true;
        });

        $sugList.delegate('li.suggestion-item', 'click', function() {
            appendItem($(this).data('sug-key'), $(this).text());
            $sugInput.val('').focus();
            itemMousedown = false;
            $sugList.hide();
        });

        $sugSelected.delegate('.sug-remove', 'click', function() {
            var itemKey = $(this).parent().data('key');
            $(this).parent().remove();
            delete selectedItems[itemKey];
            $sugWrap.data('selected-items', selectedItems);
            loadSelectOptions($select, selectedItems);
            checkMaxSelected();
        });

        $sugCopy.bind('click', function() {
            saveItemsData();
            tipOnce('复制成功, 可在其他地方粘贴数据, 便捷输入');
        });

        /**
         * 一次性消息提示并稍后消失
         * @param message
         */
        function tipOnce(message) {
            $sugInfoTip.text(message).removeClass('info').fadeIn(500);
            setTimeout(function() {
                $sugInfoTip.fadeOut(500);
            }, 2000);
        }

        /**
         * 粘贴拷贝数据, 并清除localStorage
         */
        $sugInfoTip.delegate('.sug-btn-paste', 'click', function() {
            var copyDataStr = ls.getItem(constants.STORAGE_KEY);
            var copyData = JSON.parse(copyDataStr);

            for (var key in copyData) {
                if (copyData.hasOwnProperty(key)) {
                    appendItem(key, copyData[key]);
                }
            }

            ls.removeItem(constants.STORAGE_KEY);
            hideTip();
        });

        $sugInfoTip.delegate('.sug-btn-cancel', 'click', function() {
            ls.removeItem(constants.STORAGE_KEY);
            hideTip();
        });

        /**
         * 将已选数据保存在localStorage中用于多页签内共享
         */
        function saveItemsData() {
            ls.setItem(constants.STORAGE_KEY, JSON.stringify(selectedItems));
        }

        /**
         * 检测到共享数据的操作提示
         */
        function showCopyDataTip() {
            $sugInfoTip.html('检测到您复制了数据. <a href="javascript:void(0)" class="sug-btn-paste">粘贴数据</a> <a href="javascript:void(0)" class="sug-btn-cancel">取消</a>').addClass('info').fadeIn(500);
        }

        function hideTip() {
            $sugInfoTip.fadeOut(500);
        }

        /**
         * 检测是否有新数据写入localStorage
         * 数据键写入/变化 - 显示提示
         * 数据键删除 - 隐藏提示
         */
        window.addEventListener('storage', function(e) {
            if (e.key === constants.STORAGE_KEY) {
                e.newValue ? showCopyDataTip() : hideTip();
            }
        }, false);

        /**
         * 初始化时即进行一次共享数据判断
         */
        if (ls.getItem(constants.STORAGE_KEY)) {
            showCopyDataTip();
        }
    };

    return $;

}));