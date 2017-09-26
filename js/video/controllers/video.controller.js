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
        .module('jwShowcase.video')
        .controller('VideoController', VideoController);

    /**
     * @ngdoc controller
     * @name jwShowcase.video.controller:VideoController
     *
     * @requires $scope
     * @requires $state
     * @requires $stateParams
     * @requires $timeout
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.popup
     * @requires jwShowcase.core.watchProgress
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.seo
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.core.player
     * @requires jwShowcase.core.platform
     * @requires jwShowcase.core.serviceWorker
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.config
     */
    VideoController.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'dataStore', 'popup', 'watchProgress',
        'seo', 'userSettings', 'player', 'platform', 'serviceWorker', 'utils', 'config', 'item', 'feed', 'onScroll'];

    function VideoController ($scope, $state, $stateParams, $timeout, dataStore, popup, watchProgress, seo,
                              userSettings, player, platform, serviceWorker, utils, config, item, feed, onScroll) {

        var vm                      = this,
            playlist                = [],
            $videoPlayerContainerEl = angular.element(document.querySelector('.jw-video-container-player')),
            $headerEl               = angular.element(document.querySelector('.jw-header')),
            playerOffsetTop         = 0,
            playerStuck             = false,
            playerService,
            loadingTimeout,
            onScrollDesktop,
            onScrollMobile;

        /**
         * Current playing item
         * @type {jwShowcase.core.item}
         */
        vm.item = item;

        /**
         * Config
         * @type {jwShowcase.config}
         */
        vm.config = config;

        /**
         * Loading flag
         * @type {boolean}
         */
        vm.loading = true;

        /**
         * Feed which is being used as playlist for the player.
         * @type {jwShowcase.core.feed}
         */
        vm.activeFeed = feed;

        /**
         * Title of feed
         * @type {string}
         */
        vm.activeFeedTitle = 'Next Up';

        /**
         * Is true when the right rail is enabled.
         * @type {boolean}
         */
        vm.enableRail = config.options.rightRail.enabled;

        /**
         * Player settings
         * @type {Object}
         */
        vm.playerSettings = {
            width:          '100%',
            height:         '100%',
            aspectratio:    '16:9',
            ph:             4,
            autostart:      $state.params.autoStart,
            playlist:       [],
            preload:        'metadata',
            sharing:        false,
            visualplaylist: false,
            cast:           config.options.cast || {},
            analytics:      {
                bi: config.id
            }
        };
        vm.startTime      = $stateParams.startTime;
        vm.onFirstFrame   = onFirstFrame;
        vm.onPlaylistItem = onPlaylistItem;
        vm.onReady        = onReady;
        vm.onError        = onError;
        vm.onSetupError   = onSetupError;
        vm.onAdImpression = onAdImpression;

        vm.cardClickHandler = cardClickHandler;

        activate();

        ////////////////////////

        /**
         * Initialize controller.
         */
        function activate () {

            ensureItemIsInFeed();
            createPlayerSettings();
            scrollToTop();

            $scope.$watch(function () {
                return serviceWorker.isOnline();
            }, connectionChangeHandler);

            $scope.$on('$destroy', function () {
                removeScrollHandlers();
            });

            loadingTimeout = $timeout(function () {
                vm.loading = false;
            }, 2000);
        }

        /**
         * Update the state silently. Meaning the $stateParams are updated with the new item, but the state isn't
         * reloaded. This prevents the page from reloading and reinitialising the player.
         */
        function updateStateSilently () {

            var newStateParams = {
                mediaId: vm.item.mediaid,
                slug:    utils.slugify(vm.item.title),
                list:    undefined
            };

            if (vm.item.feedid !== config.recommendationsPlaylist) {
                newStateParams.list = vm.item.feedid;
            }

            angular.merge($state.params, newStateParams);
            angular.merge($stateParams, newStateParams);

            $state.$current.locals.globals.item = vm.item;

            $state
                .go('root.video', newStateParams, {
                    notify: false
                })
                .then(function () {
                    // update the SEO metadata
                    seo.update();
                });
        }

        /**
         * Create player settings
         */
        function createPlayerSettings () {
            playlist = generatePlaylist(vm.activeFeed, item);

            vm.playerSettings.playlist = playlist;

            // disable advertising when we are offline, this prevents errors while playing videos offline in PWA.
            if (!navigator.onLine) {
                vm.playerSettings.advertising = false;
            }

            // if no skin is selected in dashboard use the jw-showcase skin
            if (!window.jwplayer.defaults.skin) {
                vm.playerSettings.skin = 'jw-showcase';
            }

            if (window.cordova) {
                vm.playerSettings.analytics.sdkplatform = platform.isAndroid ? 1 : 2;
                vm.playerSettings.cast                  = false;
            }

            // disable related overlay if showcaseContentOnly is true.
            if (config.options.showcaseContentOnly) {
                vm.playerSettings.related = false;
            }

            // override player settings from config
            if (angular.isObject(config.options.player)) {
                angular.merge(vm.playerSettings, config.options.player);
            }
        }

        /**
         * Ensure that the item is in the feed
         */
        function ensureItemIsInFeed () {

            if (!vm.activeFeed) {
                return;
            }

            var itemIndex = vm.activeFeed.playlist.findIndex(byMediaId(vm.item.mediaid));

            if (itemIndex === -1) {
                vm.activeFeed.playlist.unshift(item);
            }
        }

        /**
         * Generate playlist from feed and current item
         *
         * @param {jwShowcase.core.feed}      feed    Feed
         * @param {jwShowcase.core.item}      item    Current item
         *
         * @returns {Object} Playlist item
         */
        function generatePlaylist (feed, item) {

            var playlist     = [item],
                isPwaOffline = serviceWorker.isSupported() && !serviceWorker.isOnline(),
                isAndroid4   = platform.isAndroid && platform.platformVersion < 5,
                itemIndex    = 0;

            if (feed) {
                playlist = angular.copy(feed.playlist);

                // find item index
                itemIndex = playlist.findIndex(byMediaId(item.mediaid));

                // re-order playlist to start with given item
                playlist = playlist
                    .slice(itemIndex)
                    .concat(playlist.slice(0, itemIndex));
            }

            // filter out items that not have been downloaded when PWA is offline
            if (isPwaOffline) {
                playlist = playlist.filter(function (item) {
                    return serviceWorker.isOnline() || serviceWorker.hasDownloadedItem(item);
                });
            }

            // make small corrections to item sources
            playlist.forEach(function (playlistItem) {

                playlistItem.sources = playlistItem.sources.filter(function (source) {
                    // filter out HLS streams for Android 4
                    if (isAndroid4 && 'application/vnd.apple.mpegurl' === source.type) {
                        return false;
                    }

                    // filter out non playable sources when PWA is offline
                    if (isPwaOffline) {
                        return source.type === 'video/mp4' && source.width <= 720;
                    }

                    return 'application/dash+xml' !== source.type;
                });

                // only use the first source when PWA is offline
                if (isPwaOffline) {
                    playlistItem.sources.splice(1);
                }
            });

            return playlist;
        }

        /**
         * Handle changes in connection
         * @param val
         * @param prevVal
         */
        function connectionChangeHandler (val, prevVal) {

            // don't reload playlist when nothing changed
            if (val === prevVal) {
                return;
            }

            var state = playerService.getState();

            // reload the playlist when connection has changed to ensure all playable items are loaded in the playlist.
            if (state !== 'playing' && state !== 'paused') {
                playlist = generatePlaylist(vm.activeFeed, vm.item);
                playerService.load(playlist);
            }
        }

        /**
         * Handle ready event
         *
         * @param {Object} event
         */
        function onReady (event) {

            // wait for player ready before getting service and setting up scroll handlers
            playerService = player.getService('video');

            setupScrollHandlers();

            if (!vm.playerSettings.autostart) {
                vm.loading = false;
                $timeout.cancel(loadingTimeout);
            }
        }

        /**
         * Handle error event
         *
         * @param {Object} event
         */
        function onError (event) {

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * Handle setup error event
         */
        function onSetupError () {

            popup
                .show({
                    controller:  'ConfirmController as vm',
                    templateUrl: 'views/core/popups/confirm.html',
                    resolve:     {
                        message: 'Something went wrong while loading the video, try again?'
                    }
                })
                .then(function (result) {

                    if (true === result) {
                        $state.reload();
                    }
                });

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * Handle playlist item event
         *
         * @param {Object} event
         */
        function onPlaylistItem (event) {

            // search item in dataStore
            var newItem = dataStore.getItem(event.item.mediaid);

            // if item is not loaded in showcase
            if (!newItem) {

                // return when publisher has showcaseContentOnly set to true
                if (config.options.showcaseContentOnly) {
                    return;
                }

                // fallback to item given in event object
                newItem = event.item;
            }

            // return if item doesn't exist or its the same item
            if (newItem.mediaid === vm.item.mediaid) {
                return;
            }

            vm.item = newItem;

            updateStateSilently();
        }

        /**
         * Handle firstFrame event
         */
        function onFirstFrame () {

            if (vm.loading) {
                vm.loading = false;
            }
        }

        /**
         * Handle time event
         *
         * @param event
         */
        function onAdImpression (event) {

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * @ngdoc method
         * @name jwShowcase.video.VideoController#cardClickHandler
         * @methodOf jwShowcase.video.VideoController
         *
         * @description
         * Handle click event on the card.
         *
         * @param {jwShowcase.core.item}    newItem         Clicked item
         * @param {boolean}                 clickedOnPlay   Did the user clicked on the play button
         */
        function cardClickHandler (newItem) {

            // same item
            if (vm.item.mediaid === newItem.mediaid) {
                return;
            }

            // update current item and set playlistItem
            vm.item = angular.copy(newItem);

            // start playing item from playlist
            playerService.playlistItem(playlist.findIndex(byMediaId(vm.item.mediaid)));

            updateStateSilently();
            scrollToTop();
        }

        /**
         * @param {string} mediaId
         * @returns {Function}
         */
        function byMediaId (mediaId) {

            return function (cursor) {
                return cursor.mediaid === mediaId;
            };
        }

        function scrollToTop() {
            window.TweenLite.to(document.scrollingElement || document.body, 0.3, {
                scrollTop: 0
            });
        }

        function setupScrollHandlers() {
            var previousScreenSize = platform.screenSize();

            function setupHandlersForScreensize(evt) {
                var screenSize = platform.screenSize();
                // if screen size did not change
                if (previousScreenSize === screenSize && evt !== null) {
                    return;
                }

                // set screen size specific scroll handler for sticky player
                if (platform.screenSize() === 'mobile') {
                    // unstick desktop
                    stickPlayer(false);

                    if (onScrollDesktop) {
                        onScrollDesktop.clear();
                    }
                    onScrollMobile = onScroll.bind(mobileScrollHandler);
                } else {
                    // unstick mobile
                    stickPlayer(false, true);

                    if (onScrollMobile) {
                        onScrollMobile.clear();
                    }
                    onScrollDesktop = onScroll.bind(desktopScrollHandler);
                }

                previousScreenSize = platform.screenSize();
            }

            // calculate proper player top offset
            playerOffsetTop = utils.getElementOffsetTop($videoPlayerContainerEl[0]);

            // pass `null` to force initialisation
            setupHandlersForScreensize(null);

            // reset handlers on resize
            window.addEventListener('resize', utils.debounce(setupHandlersForScreensize, 200));
        }

        function removeScrollHandlers() {
            if (onScrollDesktop) {
                onScrollDesktop.clear();
            }

            if (onScrollMobile) {
                onScrollMobile.clear();
            }
        }

        function stickPlayer(state, forMobile) {
            if (playerStuck === state || !playerService) {
                return;
            }

            var playerInstance = playerService.getInstance();

            playerStuck = state;

            if (forMobile) {
                // stick player to top of screen

                playerInstance.utils.toggleClass($headerEl[0], 'is-hidden', state);
                playerInstance.utils.toggleClass($videoPlayerContainerEl[0], 'is-pinned', state);
            } else {
                // stick smaller player to bottom right of screen

                if (playerInstance) {
                    // wait for animation to finish
                    $videoPlayerContainerEl.one(
                        utils.getPrefixedEventNames('animationEnd'),
                        function () {
                            window.requestAnimationFrame(function () {
                                // update the player's size so the controls are adjusted
                                playerInstance.resize();
                            });
                        }
                    );
                }

                // toggle class (and animation)
                playerInstance.utils.toggleClass($videoPlayerContainerEl[0], 'minimized', state);
            }
        }

        function mobileScrollHandler() {
            // stick when we've scrolled passed header height
            stickPlayer(utils.getScrollTop() > 60, true);
        }

        function desktopScrollHandler() {
            // stick when we've scrolled passed the player's top
            stickPlayer(utils.getScrollTop() > playerOffsetTop);
        }
    }

}());
