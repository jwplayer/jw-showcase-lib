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
    VideoController.$inject = ['$state', '$stateParams', 'apiConsumer', 'dataStore', 'watchProgress', 'watchlist', 'userSettings', 'utils', 'share', 'feed', 'item'];
    function VideoController ($state, $stateParams, apiConsumer, dataStore, watchProgress, watchlist, userSettings, utils, share, feed, item) {

        var vm      = this,
            lastPos = 0,
            resumed = false,
            started = false,
            watchProgressItem;

        vm.item                = item;
        vm.feed                = feed;
        vm.recommendationsFeed = null;
        vm.duration            = 0;
        vm.inWatchList         = false;
        vm.title               = '';

        vm.onPlay         = onPlay;
        vm.onComplete     = onComplete;
        vm.onFirstFrame   = onFirstFrame;
        vm.onTime         = onTime;
        vm.onPlaylistItem = onPlaylistItem;

        vm.cardClickHandler      = cardClickHandler;
        vm.shareClickHandler     = shareClickHandler;
        vm.watchlistClickHandler = watchlistClickHandler;

        activate();

        ////////////////////////

        /**
         * Initialize the controller.
         */
        function activate () {

            vm.playerSettings = {
                width:          '100%',
                height:         '100%',
                aspectratio:    '16:9',
                ph:             4,
                autostart:      $stateParams.autoStart,
                playlist:       generatePlaylist(feed, item),
                sharing:        false,
                visualplaylist: false
            };

            update();
        }

        /**
         * Update controller
         */
        function update () {

            var itemIndex = feed.playlist.findIndex(function (current) {
                return current.mediaid === item.mediaid;
            });

            vm.duration = utils.getVideoDurationByItem(vm.item);

            vm.feed.playlist = feed.playlist
                .slice(itemIndex)
                .concat(feed.playlist.slice(0, itemIndex));

            watchProgressItem = watchProgress.getItem(vm.item);

            vm.inWatchList = watchlist.hasItem(vm.item);

            vm.title = item.title;

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
         * Handle playlist item event
         * @param {Object} event
         */
        function onPlaylistItem (event) {

            if (!event.item || event.item.mediaid === vm.item.mediaid) {
                return;
            }

            var mediaId = event.item.mediaid,
                feedId  = feed.feedid,
                newItem = dataStore.getItem(mediaId, feedId);

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
            });

            this.stop();
        }

        /**
         * Handle play event
         * @param event
         */
        function onPlay (event) {

            // watchProgress is disabled
            if (false === userSettings.settings.watchProgress) {
                return;
            }

            if ($stateParams.autoStart) {
                resumeWatchProgress(this);
                started = true;
            }
        }

        /**
         * Handle firstFrame event
         * @param event
         */
        function onFirstFrame (event) {

            var levels = this.getQualityLevels();

            // hd turned off
            // set quality level to lowest quality possible
            if (true === userSettings.settings.conserveBandwidth) {
                this.setCurrentQuality(levels.length - 2);
            }

            // watchProgress is disabled
            if (false === userSettings.settings.watchProgress) {
                return;
            }

            if (!$stateParams.autoStart) {
                resumeWatchProgress(this);
                started = true;
            }
        }

        /**
         * Handle complete event
         * @param event
         */
        function onComplete (event) {

            watchProgress.removeItem(vm.item);
        }

        /**
         * Handle time event
         * @param event
         */
        function onTime (event) {

            var position = Math.round(event.position),
                progress = event.position / event.duration;

            // watchProgress is disabled
            if (false === userSettings.settings.watchProgress) {
                return;
            }

            // resume watch progress fail over when duration was 0 on the play or firstFrame event

            if (true === started && false === resumed && !!watchProgressItem) {
                resumeWatchProgress(this);
                return;
            }

            // occasionally the onTime event fires before the onPlay or onFirstFrame event.
            // so we have to prevent updating the watchProgress before the video has started

            if (false === started || !vm.item.feedid || lastPos === position) {
                return;
            }

            lastPos = position;

            if (angular.isNumber(progress) && position % 2) {
                handleWatchProgress(progress);
            }
        }

        /**
         *
         * @param player
         */
        function resumeWatchProgress (player) {

            var duration        = player.getDuration(),
                toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

            if (toWatchProgress > 0 && duration > 0) {
                player.seek(toWatchProgress * duration);
                resumed = true;
            }
        }

        /**
         * Save or remove watchProgress
         * @param {number} progress
         */
        function handleWatchProgress (progress) {

            if (progress > watchProgress.WATCH_PROGRESS_MAX) {
                if (watchProgress.hasItem(vm.item)) {
                    watchProgress.removeItem(vm.item);
                }
            }
            else {
                watchProgress.saveItem(vm.item, progress);
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
                item:   item
            });
        }

        /**
         * Handle click event on card
         *
         * @param {Object}      item        Clicked item
         * @param {boolean}     autoStart   Should the video playback start automatically
         */
        function cardClickHandler (item, autoStart) {

            $state.go('root.video', {
                feedId:    item.feedid,
                mediaId:   item.mediaid,
                autoStart: autoStart
            });
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