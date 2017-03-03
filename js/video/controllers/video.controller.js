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
     * @requires $timeout
     * @requires $ionicHistory
     * @requires $ionicScrollDelegate
     * @requires jwShowcase.core.apiConsumer
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.watchProgress
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.seo
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.share
     * @requires jwShowcase.core.player
     * @requires jwShowcase.config
     */
    VideoController.$inject = ['$scope', '$state', '$timeout', '$ionicHistory', '$ionicScrollDelegate', '$ionicPopup',
        'apiConsumer', 'FeedModel', 'dataStore', 'watchProgress', 'watchlist', 'seo', 'userSettings', 'utils', 'player',
        'config', 'feed', 'item'];
    function VideoController ($scope, $state, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicPopup, apiConsumer,
                              FeedModel, dataStore, watchProgress, watchlist, seo, userSettings, utils, player, config,
                              feed, item) {

        var vm                     = this,
            lastPos                = 0,
            resumed                = false,
            started                = false,
            requestQualityChange   = false,
            itemFeed               = feed,
            loadingRecommendations = false,
            playerPlaylist         = [],
            playerLevels,
            watchProgressItem,
            loadingTimeout;

        vm.item                = item;
        vm.feed                = feed.clone();
        vm.recommendationsFeed = null;
        vm.loading             = true;

        vm.onComplete     = onComplete;
        vm.onFirstFrame   = onFirstFrame;
        vm.onTime         = onTime;
        vm.onPlaylistItem = onPlaylistItem;
        vm.onLevels       = onLevels;
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

            playerPlaylist = generatePlaylist(itemFeed, item);

            vm.playerSettings = {
                width:          '100%',
                height:         '100%',
                aspectratio:    '16:9',
                ph:             4,
                autostart:      $state.params.autoStart,
                playlist:       playerPlaylist,
                related:        false,
                preload:        'metadata',
                sharing:        false,
                visualplaylist: false,
                analytics:      {
                    bi: config.id
                }
            };

            if (!window.jwplayer.defaults.skin) {
                vm.playerSettings.skin = 'jw-showcase';
            }

            if (!!window.cordova) {
                vm.playerSettings.analytics.sdkplatform = ionic.Platform.isAndroid() ? 1 : 2;
            }

            $scope.$watch(function () {
                return userSettings.settings.conserveBandwidth;
            }, conserveBandwidthChangeHandler);

            loadingTimeout = $timeout(function () {
                vm.loading = false;
            }, 2000);

            update();
        }

        /**
         * Update controller
         */
        function update () {

            var itemIndex = itemFeed.playlist.findIndex(byMediaId(vm.item.mediaid));

            vm.feed.playlist = itemFeed.playlist
                .slice(itemIndex)
                .concat(itemFeed.playlist.slice(0, itemIndex));

            watchProgressItem = watchProgress.getItem(vm.item);

            loadRecommendations();
        }

        /**
         * Load recommendations
         */
        function loadRecommendations () {

            if (!config.recommendationsPlaylist) {
                vm.recommendationsFeed = null;
                return;
            }

            if (loadingRecommendations) {
                return;
            }

            loadingRecommendations = true;

            if (!vm.recommendationsFeed) {
                vm.recommendationsFeed = new FeedModel(config.recommendationsPlaylist, 'Related Videos', false);
            }

            vm.recommendationsFeed.relatedMediaId = vm.item.mediaid;

            apiConsumer
                .populateFeedModel(vm.recommendationsFeed, 'recommendations')
                .then(function (recommendationsFeed) {

                    // filter duplicate video's
                    if (angular.isArray(recommendationsFeed.playlist)) {
                        recommendationsFeed.playlist = recommendationsFeed.playlist.filter(function (item) {
                            return itemFeed.playlist.findIndex(byMediaId(item.mediaid)) === -1;
                        });
                    }

                    loadingRecommendations = false;
                });
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

            var playlistIndex = feed.playlist.findIndex(byMediaId(item.mediaid)),
                isAndroid4    = ionic.Platform.isAndroid() && ionic.Platform.version() < 5,
                playlist, sources;

            playlist = angular.copy(feed.playlist)
                .slice(playlistIndex)
                .concat(feed.playlist.slice(0, playlistIndex));

            return playlist.map(function (current) {

                sources = current.sources.filter(function (source) {

                    // filter out HLS streams for Android 4
                    if (isAndroid4 && 'application/vnd.apple.mpegurl' === source.type) {
                        return false;
                    }

                    return 'application/dash+xml' !== source.type;
                });

                return {
                    mediaid:     current.mediaid,
                    title:       current.title,
                    description: current.description,
                    image:       utils.replaceImageSize(current.image, 1920),
                    sources:     angular.copy(sources),
                    tracks:      angular.copy(current.tracks)
                };
            });
        }

        /**
         * Handle conserveBandwidth setting change
         *
         * @param {boolean} value
         */
        function conserveBandwidthChangeHandler (value) {

            var levelsLength,
                toQuality = 0;

            // nothing to do
            if (!playerLevels) {
                return;
            }

            levelsLength = playerLevels.length;

            if (true === value) {
                toQuality = levelsLength > 2 ? levelsLength - 2 : levelsLength;
            }

            requestQualityChange = toQuality;
        }

        /**
         * Handle ready event
         *
         * @param {Object} event
         */
        function onReady (event) {

            if (config.enablePlayerAutoFocus && angular.isFunction(this.getContainer)) {
                this.getContainer().focus();
            }

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
         *
         * @param {Object} event
         */
        function onSetupError (event) {

            $ionicPopup.show({
                cssClass: 'jw-dialog',
                template: '<strong>Oops! Something went wrong. Try again?</strong>',
                buttons:  [{
                    text:  'Yes',
                    type:  'jw-button jw-button-primary',
                    onTap: function () {
                        return true;
                    }
                }, {
                    text:  'No',
                    type:  'jw-button jw-button-light',
                    onTap: function () {
                        return false;
                    }
                }]
            }).then(function (retry) {

                if (retry) {
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

            var playlistItem = playerPlaylist[event.index],
                stateParams  = $ionicHistory.currentView().stateParams,
                newItem;

            if (!angular.isNumber(event.index) || !playlistItem) {
                return;
            }

            newItem = dataStore.getItem(playlistItem.mediaid, itemFeed.feedid);

            // same item
            if (!newItem || newItem.mediaid === vm.item.mediaid) {
                return;
            }

            // item does not exist in current feed.
            if (!newItem) {
                return;
            }

            // update $viewHistory
            stateParams.feedId  = newItem.feedid;
            stateParams.mediaId = newItem.mediaid;
            stateParams.slug    = newItem.$slug;

            // update state, but don't notify
            $state
                .go('root.video', {
                    feedId:    newItem.feedid,
                    mediaId:   newItem.mediaid,
                    slug:      newItem.$slug,
                    autoStart: true
                }, {
                    notify: false
                })
                .then(function () {
                    seo.update();
                });

            vm.item = newItem;
            update();
        }

        /**
         * Handle firstFrame event
         */
        function onFirstFrame () {

            var levelsLength = playerLevels.length;

            if (vm.loading) {
                vm.loading = false;
            }

            started = true;

            // hd turned off
            // set quality to last lowest level
            if (true === userSettings.settings.conserveBandwidth) {
                player.setCurrentQuality(levelsLength > 2 ? levelsLength - 2 : levelsLength);
            }
        }

        /**
         * Handle levels event
         *
         * @param event
         */
        function onLevels (event) {

            playerLevels = event.levels;
        }


        /**
         * Handle complete event
         */
        function onComplete () {

            watchProgress.removeItem(vm.item);
        }

        /**
         * Handle time event
         *
         * @param event
         */
        function onTime (event) {

            var position = Math.round(event.position);

            if (false !== requestQualityChange) {
                player.setCurrentQuality(requestQualityChange);
                requestQualityChange = false;
            }

            // watchProgress is disabled
            if (false === userSettings.settings.watchProgress || false === config.enableContinueWatching) {
                return;
            }

            // resume watch progress fail over when duration was 0 on the play or firstFrame event

            if (true === started && false === resumed && !!watchProgressItem) {
                resumeWatchProgress(event.duration);
                return;
            }

            // occasionally the onTime event fires before the onPlay or onFirstFrame event.
            // so we have to prevent updating the watchProgress before the video has started

            if (false === started || !vm.item.feedid || lastPos === position) {
                return;
            }

            lastPos = position;

            handleWatchProgress(position, event.duration);
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
         * Resume video playback at last saved position from watchProgress
         *
         * @param {Number} duration
         */
        function resumeWatchProgress (duration) {

            var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

            if (toWatchProgress > 0 && duration > 0) {
                player.seek(toWatchProgress * duration);
                resumed = true;
            }
        }

        /**
         * Saves or removes watchProgress
         *
         * @param {number} position
         * @param {number} duration
         */
        function handleWatchProgress (position, duration) {

            var progress      = position / duration,
                minPosition   = Math.min(10, duration * watchProgress.MIN_PROGRESS),
                maxPosition   = Math.max(duration - 10, duration * watchProgress.MAX_PROGRESS),
                betweenMinMax = position >= minPosition && position < maxPosition;

            if (angular.isNumber(progress) && betweenMinMax && !watchlist.hasItem(vm.item)) {
                watchProgress.saveItem(vm.item, progress);
                return;
            }

            if (watchProgress.hasItem(vm.item)) {
                watchProgress.removeItem(vm.item, progress);
            }
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
        function cardClickHandler (newItem, clickedOnPlay) {

            var playlistIndex,
                stateParams = $ionicHistory.currentView().stateParams;

            // same item
            if (vm.item.mediaid === newItem.mediaid) {
                return;
            }

            vm.item = angular.extend({}, newItem);

            stateParams.mediaId = vm.item.mediaid;
            stateParams.feedId  = vm.item.feedid;
            stateParams.slug    = vm.item.$slug;

            // update itemFeed and playlist when feed is different
            if (vm.item.feedid !== itemFeed.feedid) {

                itemFeed = dataStore.getFeed(vm.item.feedid);
                vm.feed  = itemFeed.clone();

                playerPlaylist = generatePlaylist(itemFeed, vm.item);
                player.load(playerPlaylist);

                if (clickedOnPlay || window.cordova) {
                    player.play(true);
                }
            }
            else {
                playlistIndex = playerPlaylist.findIndex(byMediaId(vm.item.mediaid));
                player.playlistItem(playlistIndex);
            }

            $state
                .go('root.video', {
                    feedId:    vm.item.feedid,
                    mediaId:   vm.item.mediaid,
                    slug:      vm.item.$slug,
                    autoStart: clickedOnPlay
                }, {
                    notify: false
                })
                .then(function () {
                    seo.update();
                });

            update();
            $ionicScrollDelegate.scrollTop(true);
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
    }

}());
