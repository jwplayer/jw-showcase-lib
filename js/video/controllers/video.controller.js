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
     * @requires jwShowcase.core.apiConsumer
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.watchProgress
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.share
     */
    VideoController.$inject = ['$scope', '$state', '$stateParams', 'apiConsumer', 'dataStore', 'watchProgress', 'watchlist', 'userSettings', 'utils', 'share', 'feed', 'item'];
    function VideoController ($scope, $state, $stateParams, apiConsumer, dataStore, watchProgress, watchlist, userSettings, utils, share, feed, item) {

        var vm             = this,
            lastPos        = 0,
            resumed        = false,
            started        = false,
            playerPlaylist = [],
            playerDelegate,
            playerLevels,
            initialLevel,
            watchProgressItem;

        vm.item                = item;
        vm.feed                = feed;
        vm.recommendationsFeed = null;
        vm.duration            = 0;
        vm.inWatchList         = false;
        vm.title               = '';

        vm.onReady        = onReady;
        vm.onComplete     = onComplete;
        vm.onFirstFrame   = onFirstFrame;
        vm.onTime         = onTime;
        vm.onPlaylistItem = onPlaylistItem;
        vm.onLevels       = onLevels;

        vm.cardClickHandler      = cardClickHandler;
        vm.shareClickHandler     = shareClickHandler;
        vm.watchlistClickHandler = watchlistClickHandler;

        activate();

        ////////////////////////

        /**
         * Initialize the controller.
         */
        function activate () {

            playerPlaylist = generatePlaylist(feed, item);

            vm.playerSettings = {
                width:          '100%',
                height:         '100%',
                aspectratio:    '16:9',
                ph:             4,
                autostart:      $stateParams.autoStart,
                playlist:       playerPlaylist,
                related:        false,
                sharing:        false,
                visualplaylist: false
            };

            $scope.$watch(function () {
                return userSettings.settings.conserveBandwidth;
            }, conserveBandwidthChangeHandler);

            update();
        }

        /**
         * Update controller
         */
        function update () {

            var itemIndex = feed.playlist.findIndex(function (current) {
                return current.mediaid === vm.item.mediaid;
            });

            vm.duration = utils.getVideoDurationByItem(vm.item);

            vm.feed.playlist = feed.playlist
                .slice(itemIndex)
                .concat(feed.playlist.slice(0, itemIndex));

            watchProgressItem = watchProgress.getItem(vm.item);

            vm.inWatchList = watchlist.hasItem(vm.item);

            vm.title = vm.item.title;

            if (vm.title.length > 100) {
                vm.title = vm.title.substr(0, 100) + '...';
            }

            // load recommendations at this stage to prevent load time to the video page
            apiConsumer
                .getRecommendationsFeed(item.mediaid)
                .then(function (response) {

                    // filter duplicate video's
                    if (angular.isArray(response.playlist)) {
                        response.playlist = response.playlist.filter(function (item) {
                            return feed.playlist.findIndex(byMediaId(item.mediaid)) === -1;
                        });
                    }

                    vm.recommendationsFeed = response;
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

            var indexOfItem = feed.playlist.findIndex(function (playlistItem) {
                    return playlistItem.mediaid === item.mediaid;
                }),
                playlist    = feed.playlist.slice(indexOfItem);

            return playlist.map(function (current) {

                return {
                    mediaid:     current.mediaid,
                    title:       current.title,
                    description: current.description,
                    image:       utils.replaceImageSize(current.image, 1920),
                    sources:     current.sources,
                    tracks:      current.tracks
                };
            });
        }

        /**
         * Handle conserveBandwidth setting change
         * @param {boolean} value
         */
        function conserveBandwidthChangeHandler (value) {

            var levelsLength,
                toQuality = initialLevel;

            // nothing to do
            if (!playerLevels || !playerDelegate) {
                return;
            }

            levelsLength = playerLevels.length;

            if (true === value) {
                toQuality = levelsLength > 2 ? levelsLength - 1 : levelsLength;
            }

            playerDelegate.setCurrentQuality(toQuality);
        }

        /**
         * Handle ready event
         */
        function onReady () {

            playerDelegate = this;
        }

        /**
         * Handle playlist item event
         * @param {Object} event
         */
        function onPlaylistItem (event) {

            var playlistItem = playerPlaylist[event.index],
                newItem;

            if (!angular.isNumber(event.index) || !playlistItem) {
                return;
            }

            newItem = dataStore.getItem(playlistItem.mediaid, feed.feedid);

            // same item
            if (newItem.mediaid === vm.item.mediaid) {
                return;
            }

            // item does not exist in current feed.
            if (!newItem) {
                // show dialog!
                return;
            }

            // update state, but don't notify
            $state.go('root.video', {
                feedId:    newItem.feedid,
                mediaId:   newItem.mediaid,
                autoStart: true
            }, {
                notify: false
            });

            vm.item = newItem;
            update();

            playerDelegate.stop();
        }

        /**
         * Handle firstFrame event
         */
        function onFirstFrame () {

            started = true;
        }

        /**
         * Handle levels event
         * @param event
         */
        function onLevels (event) {

            var levelsLength;

            playerLevels = event.levels;
            levelsLength = playerLevels.length;
            initialLevel = event.currentQuality;

            // hd turned off
            // set quality to last lowest level
            if (true === userSettings.settings.conserveBandwidth) {
                playerDelegate.setCurrentQuality(levelsLength > 2 ? levelsLength - 1 : levelsLength);
            }
        }


        /**
         * Handle complete event
         */
        function onComplete () {

            watchProgress.removeItem(vm.item);
        }

        /**
         * Handle time event
         * @param event
         */
        function onTime (event) {

            var position = Math.round(event.position);

            // watchProgress is disabled
            if (false === userSettings.settings.watchProgress) {
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
         * Resume video playback at last saved position from watchProgress
         *
         * @param {Number} duration
         */
        function resumeWatchProgress (duration) {

            var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

            if (toWatchProgress > 0 && duration > 0) {
                playerDelegate.seek(toWatchProgress * duration);
                resumed = true;
            }
        }

        /**
         * Saves or removes watchProgress
         * @param {number} position
         * @param {number} duration
         */
        function handleWatchProgress (position, duration) {

            var progress    = position / duration,
                minPosition = Math.min(10, duration * watchProgress.MIN_PROGRESS),
                maxPosition = Math.max(duration - 10, duration * watchProgress.MAX_PROGRESS);

            if (angular.isNumber(progress) && position >= minPosition && position < maxPosition) {
                watchProgress.saveItem(vm.item, progress);
                return;
            }

            if (watchProgress.hasItem(vm.item)) {
                watchProgress.removeItem(vm.item, progress);
            }
        }

        /**
         * Handle click event on watchlist button
         */
        function watchlistClickHandler () {

            if (watchlist.hasItem(vm.item)) {
                watchlist.removeItem(vm.item);
                vm.inWatchList = false;
            }
            else {
                watchlist.addItem(vm.item);
                vm.inWatchList = true;
            }
        }

        /**
         * Handle click event on share button
         * @param $event
         */
        function shareClickHandler ($event) {

            share.show({
                target: $event.target,
                item:   vm.item
            });
        }

        /**
         * Handle click event on card
         *
         * @param {Object}      item        Clicked item
         * @param {boolean}     autoStart   Should the video playback start automatically
         */
        function cardClickHandler (item, autoStart) {

            var playlistIndex;

            vm.item = item;

            if (item.feedid !== feed.feedid) {

                vm.feed        = dataStore.getFeed(item.feedid);
                playerPlaylist = generatePlaylist(vm.feed, vm.item);

                playerDelegate.loadPlaylist(playerPlaylist);
            }
            else {
                // set playlistItem
                playlistIndex = playerPlaylist.findIndex(byMediaId(item.mediaid));
                playerDelegate.playlistItem(playlistIndex);
            }

            $state.go('root.video', {
                feedId:    item.feedid,
                mediaId:   item.mediaid,
                autoStart: autoStart
            }, {
                notify: false
            });

            update();
        }

        /**
         * @param mediaId
         * @returns {Function}
         */
        function byMediaId (mediaId) {

            return function (item) {
                return item.mediaid === mediaId;
            }
        }
    }

}());