/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

    angular
        .module('jwShowcase.core')
        .directive('jwCard', cardDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCard
     * @module jwShowcase.core
     *
     * @description
     * # jwCard
     * The `jwCard` directive renders a playlist item. There are two possible styles available; 'default' or
     * 'featured'.
     *
     * @scope
     *
     * @param {jwShowcase.core.item}    item            Playlist item
     * @param {boolean=}                featured        Featured flag
     * @param {function=}               onClick         Will be called when an click event occurs on the card.
     *
     * @example
     *
     * ```
     * <jw-card item="item" featured="false" show-title="true"></jw-card>
     * ```
     */
    cardDirective.$inject = ['$animate', '$q', '$state', '$timeout', '$templateCache', '$compile', 'dataStore',
        'watchlist', 'utils', 'serviceWorker'];
    function cardDirective ($animate, $q, $state, $timeout, $templateCache, $compile, dataStore, watchlist, utils,
                            serviceWorker) {

        return {
            scope:            {
                item:     '=',
                featured: '=',
                onClick:  '='
            },
            controllerAs:     'vm',
            controller:       angular.noop,
            bindToController: true,
            replace:          true,
            templateUrl:      'views/core/card.html',
            link:             link
        };

        function link (scope, element) {

            scope.vm.showToast              = showToast;
            scope.vm.closeMenu              = closeMenu;
            scope.vm.menuButtonClickHandler = menuButtonClickHandler;
            scope.vm.containerClickHandler  = containerClickHandler;

            activate();

            /////////////

            function activate () {

                var feed       = dataStore.getFeed(scope.vm.item.feedid),
                    enableText = true,
                    link       = generateLink();

                element.addClass('jw-card-flag-' + (scope.vm.featured ? 'featured' : 'default'));

                if (feed && $state.is('root.dashboard')) {
                    enableText = feed.enableText;
                }

                if (!enableText) {
                    element.addClass('jw-card-flag-hide-text');
                }

                if (serviceWorker.isSupported()) {
                    activateOfflineSupport();
                }

                findElement('.jw-card-container')
                    .attr('aria-label', 'play video ' + scope.vm.item.title);

                findElement('.jw-card-title')
                    .html(scope.vm.item.title)
                    .attr('href', link)
                    .on('click', titleClickHandler);

                findElement('.jw-card-duration')
                    .html(utils.getVideoDurationByItem(scope.vm.item));

                // set watch progress
                if (scope.vm.item.feedid === 'continue-watching') {
                    scope.$watch('vm.item.progress', watchProgressUpdateHandler);
                }

                scope.$on('$destroy', destroyDirectiveHandler);

                scope.$watch(function () {
                    return watchlist.hasItem(scope.vm.item);
                }, watchlistUpdateHandler);
            }

            /**
             * Generate link to page, mostly used for SEO indexing
             */
            function generateLink () {

                if ($state.is('root.search')) {
                    return $state.href('root.videoFromSearch', {
                        query:   $state.params.query,
                        mediaId: scope.vm.item.mediaid,
                        slug:    scope.vm.item.$slug
                    });
                }

                return $state.href('root.video', {
                    feedId:  scope.vm.item.$feedid || scope.vm.item.feedid,
                    mediaId: scope.vm.item.mediaid,
                    slug:    scope.vm.item.$slug
                });
            }

            /**
             * Activate offline support
             */
            function activateOfflineSupport () {

                scope.$watch(function () {
                    return serviceWorker.hasDownloadedItem(scope.vm.item);
                }, setOfflineAvailable);
            }

            /**
             * @param available
             */
            function setOfflineAvailable (available) {

                element.toggleClass('jw-card-flag-offline-available', available);
            }

            /**
             * Cleanup directive
             */
            function destroyDirectiveHandler () {

                findElement('.jw-card-container').off();
            }

            /**
             * Find child element
             * @param {string} selector
             * @returns {Object}
             */
            function findElement (selector) {

                return angular.element(element[0].querySelector(selector));
            }

            /**
             * Handle click event on title element
             * @param event
             */
            function titleClickHandler (event) {

                event.preventDefault();
            }

            /**
             * Handle click event on the card container
             * @param event
             */
            function containerClickHandler (event) {

                var playButton    = findElement('.jw-card-play-button')[0],
                    clickedOnPlay = playButton === event.target || playButton === event.target.parentNode;

                if (angular.isFunction(scope.vm.onClick)) {
                    scope.vm.onClick(scope.vm.item, clickedOnPlay);
                }
            }

            /**
             * Handle click on the menu button
             */
            function menuButtonClickHandler () {

                // execute in next tick to prevent the clickOutside handler to close the menu immediately
                $timeout(showMenu, 1);
            }

            /**
             * Handle click on the watchlist button
             */
            function watchlistButtonClickHandler () {

                showToast({
                    templateUrl: 'views/core/toasts/unsavedVideo.html',
                    duration:    1200
                }).then(null, null, function () {
                    watchlist.removeItem(scope.vm.item);
                });
            }

            function watchProgressUpdateHandler () {

                findElement('.jw-card-watch-progress')
                    .removeClass('ng-hide')
                    .css('width', (scope.vm.item.progress * 100) + '%');
            }

            /**
             * Handle when this item gets added or removed from the watchlist
             * @param inWatchlist
             */
            function watchlistUpdateHandler (inWatchlist) {

                var watchlistButton = findElement('.jw-card-watchlist-button'),
                    exists          = !!watchlistButton.length;

                if (inWatchlist && !exists) {

                    watchlistButton = $compile($templateCache.get('views/core/cardWatchlistButton.html'))(scope.$new());
                    watchlistButton.on('click', watchlistButtonClickHandler);

                    $animate.enter(watchlistButton, element, findElement('.jw-card-menu-button'));
                }

                if (!inWatchlist && exists) {

                    watchlistButton.off();
                    watchlistButton.scope().$destroy();
                    $animate.leave(watchlistButton);
                }
            }

            /**
             * Show the menu
             */
            function showMenu () {

                var cardMenu = findElement('.jw-card-menu');

                if (!cardMenu.length) {
                    cardMenu = $compile('<jw-card-menu item="vm.item"></jw-card-menu>')(scope.$new());
                    $animate
                        .enter(cardMenu, element, findElement('.jw-card-toasts'))
                        .then(function () {
                            // focus first button in menu
                            cardMenu[0].querySelectorAll('.jw-button')[0].focus();
                        });
                    element.addClass('jw-card-flag-menu-open');
                }
            }

            /**
             * Close the menu
             *
             * @param {boolean} restoreFocus If true, focus the card menu button
             */
            function closeMenu (restoreFocus) {

                var cardMenu = findElement('.jw-card-menu');

                if (cardMenu.length) {
                    cardMenu.scope().$destroy();
                    $animate.leave(cardMenu);
                    element.removeClass('jw-card-flag-menu-open');

                    if (restoreFocus) {
                        // bring focus back to menu button
                        findElement('.jw-card-menu-button')[0].focus();
                    }
                }
            }

            /**
             * Show a toast over the card
             *
             * @param {Object} toast                Toast options object
             * @param {String} toast.templateUrl    Template url
             * @param {Number} [toast.duration]     Optional duration
             *
             * @returns {Promise|function}
             */
            function showToast (toast) {

                var defer         = $q.defer(),
                    html          = $templateCache.get(toast.templateUrl),
                    children      = element.children(),
                    toastsElement = angular.element(element[0].querySelector('.jw-card-toasts')),
                    toastElement  = angular.element(html);

                // add toast to card with enter animation
                $animate.enter(toastElement, toastsElement, children[children.length - 1]);

                // add class to card element
                element.addClass('jw-card-flag-toast-open');

                if (toast.duration !== -1) {
                    // set timeout to remove toast
                    $timeout(closeToast, toast.duration || 1000);
                }

                function closeToast () {

                    defer.notify('before_remove');

                    $animate
                        .leave(toastElement)
                        .then(function () {
                            element.removeClass('jw-card-flag-toast-open');
                            defer.resolve();
                        });
                }

                if (toast.duration === -1) {
                    return function () {
                        closeToast();
                        return defer.promise;
                    };
                }
                return defer.promise;
            }
        }
    }

}());
