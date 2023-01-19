/* Icinga DB Web | (c) 2020 Icinga GmbH | GPLv2 */

;(function () {

    "use strict";

    try {
        var notjQuery = require('icinga/icinga-php-library/notjQuery');
    } catch (e) {
        console.warn('Unable to provide input enrichments. Libraries not available:', e);
        return;
    }

    /**
     * Parse the filter query contained in the given URL query string
     *
     * @param {string} queryString
     *
     * @returns {array}
     */
    var parseSelectionQuery = function (queryString) {
        return queryString.split('|');
    };

    Icinga.Behaviors = Icinga.Behaviors || {};

    var ActionList = function (icinga) {
        Icinga.EventListener.call(this, icinga);

        this.on('click', '.action-list [data-action-item]:not(.page-separator), .action-list [data-action-item] a[href]', this.onClick, this);
        this.on('close-column', this.onColumnClose, this);

        this.on('rendered', '.container', this.onRendered, this);
    };

    ActionList.prototype = new Icinga.EventListener();

    ActionList.prototype.onClick = function (event) {
        var _this = event.data.self;
        var $activeItems;
        var $target = $(event.currentTarget);
        var $item = $target.closest('[data-action-item]');
        var $list = $item.closest('.action-list');

        if ($target.is('a') && (! $target.is('.subject') || event.ctrlKey || event.metaKey)) {
            return true;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        var container = $list.closest('.container');

        if ($list.is('[data-icinga-multiselect-url]')) {
            if (event.ctrlKey || event.metaKey) {
                $item.toggleClass('active');
            } else if (event.shiftKey) {
                document.getSelection().removeAllRanges();

                $activeItems = $list.find('[data-action-item].active');

                var $firstActiveItem = $activeItems.first();

                $activeItems.removeClass('active');

                $firstActiveItem.addClass('active');
                $item.addClass('active');

                if ($item.index() > $firstActiveItem.index()) {
                    $item.prevUntil($firstActiveItem).addClass('active');
                } else {
                    var $lastActiveItem = $activeItems.last();

                    $lastActiveItem.addClass('active');
                    $item.nextUntil($lastActiveItem).addClass('active');
                }
            } else {
                $list.find('[data-action-item].active').removeClass('active');
                $item.addClass('active');
            }

            // For items that do not have a bottom status bar like Downtimes, Comments...
            if (! container.children('.footer').length) {
                container.append('<div class="footer" data-action-list-automatically-added></div>');
            }
        } else {
            $list.find('[data-action-item].active').removeClass('active');
            $item.addClass('active');
        }

        $activeItems = $list.find('[data-action-item].active');
        var footer = container.children('.footer');

        if ($activeItems.length === 0) {
            if (footer.length) {
                if (typeof footer.data('action-list-automatically-added') !== 'undefined') {
                    footer.remove();
                } else {
                    footer.children('.selection-count').remove();
                }
            }

            if (_this.icinga.loader.getLinkTargetFor($target).attr('id') === 'col2') {
                _this.icinga.ui.layout1col();
            }
        } else {
            var url;

            if ($activeItems.length === 1) {
                url = $target.is('a') ? $target.attr('href') : $activeItems.find('[href]').first().attr('href');
            } else {
                var filters = $activeItems.map(function () {
                    return $(this).attr('data-icinga-multiselect-filter');
                });

                url = $list.attr('data-icinga-multiselect-url') + '?' + filters.toArray().join('|');
            }

            if ($list.is('[data-icinga-multiselect-url]')) {
                if (! footer.children('.selection-count').length) {
                    footer.prepend('<div class="selection-count"></div>');
                }

                var label = $list.data('icinga-multiselect-count-label').replace('%d', $activeItems.length);
                var selectedItems = footer.find('.selection-count > .selected-items');
                if (selectedItems.length) {
                    selectedItems.text(label);
                } else {
                    footer.children('.selection-count').append('<span class="selected-items">' + label + '</span>');
                }
            }

            _this.icinga.loader.loadUrl(
                url, _this.icinga.loader.getLinkTargetFor($target)
            );
        }
    };

    ActionList.prototype.onColumnClose = function (event) {
        var $target = $(event.target);

        if ($target.attr('id') !== 'col2') {
            return;
        }

        var $list = $('#col1').find('.action-list');
        if ($list.length && $list.is('[data-icinga-multiselect-url]')) {
            var _this = event.data.self;
            var detailUrl = _this.icinga.utils.parseUrl(_this.icinga.history.getCol2State().replace(/^#!/, ''));

            if ($list.attr('data-icinga-multiselect-url') === detailUrl.path) {
                $.each(parseSelectionQuery(detailUrl.query.slice(1)), function (i, filter) {
                    $list.find(
                        '[data-icinga-multiselect-filter="' + filter + '"]'
                    ).removeClass('active');
                });
            } else if ($list.attr('data-icinga-detail-url') === detailUrl.path) {
                $list.find(
                    '[data-icinga-detail-filter="' + detailUrl.query.slice(1) + '"]'
                ).removeClass('active');
            }

            var footer = $list.closest('.container').children('.footer');

            if (footer.length) {
                if (typeof footer.data('action-list-automatically-added') !== 'undefined') {
                    footer.remove();
                } else {
                    footer.children('.selection-count').remove();
                }
            }
        }
    };

    ActionList.prototype.onRendered = function (event) {
        let container = event.target;
        let isTopLevelContainer = container.matches('#main > :scope');

        if (event.currentTarget !== container) {
            // Nested containers are not processed multiple times
            return;
        } else if (isTopLevelContainer && container.id !== 'col1') {
            return;
        }

        let list = container.querySelector('.action-list');

        if (list && list.matches('[data-icinga-multiselect-url], [data-icinga-detail-url]')) {
            let _this = event.data.self;
            let detailUrl = _this.icinga.utils.parseUrl(_this.icinga.history.getCol2State().replace(/^#!/, ''));

            if (list.dataset.icingaMultiselectUrl === detailUrl.path) {
                for (const filter of parseSelectionQuery(detailUrl.query.slice(1))) {
                    let item = list.querySelector('[data-icinga-multiselect-filter="' + filter + '"]');
                    if (item) {
                        item.classList.add('active');
                    }
                }
            } else if (list.dataset.icingaDetailUrl === detailUrl.path) {
                let item = list.querySelector('[data-icinga-detail-filter="' + detailUrl.query.slice(1) + '"]');
                if (item) {
                    item.classList.add('active');
                }
            }
        }

        if (list && isTopLevelContainer && list.matches('[data-icinga-multiselect-url]')) {
            let activeItems = list.querySelectorAll('[data-action-item].active');

            if (activeItems.length) {
                if (! container.querySelector('.footer')) {
                    container.appendChild(notjQuery.render(
                        '<div class="footer" data-action-list-automatically-added></div>'
                    ));
                }

                let label = list.dataset.icingaMultiselectCountLabel.replace('%d', activeItems.length);
                container.querySelector('.footer').prepend(notjQuery.render(
                    '<div class="selection-count"><span class="selected-items">' + label + '</span></div>'
                ));
            }
        }
    };

    Icinga.Behaviors.ActionList = ActionList;
}());
