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

    var LARGE_SCREEN                        = window.matchMedia('(min-device-width: 960px)').matches,
        THUMBNAIL_AUTOMATIC_TIMEOUT         = 500,
        THUMBNAIL_AUTOMATIC_INTERVAL        = 2300,
        CONTINUE_WATCHING_THUMBNAIL_QUALITY = 320,
        DEFAULT_CARD_THUMBNAIL_QUALITY      = 120,
        FEATURED_CARD_THUMBNAIL_QUALITY     = 320;

    angular
        .module('jwShowcase.core')
        .directive('jwCardPoster', jwCardPoster);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCardPoster
     * @module jwShowcase.core
     *
     * @description
     * # jwCardPoster
     * The `jwCardPoster` directive is responsible for showing the item poster or thumbnail.
     */

    jwCardPoster.$inject = ['$http', '$q', 'dataStore', 'platform', 'utils'];
    function jwCardPoster ($http, $q, dataStore, platform, utils) {

        return {
            link:    link,
            require: '^jwCard'
        };

        function link (scope, element, attrs, jwCard) {

            var itemPosterUrl,
                mouseOver             = false,
                thumbnailsLoaded      = false,
                thumbnailsLoading     = false,
                thumbnailsTrack       = null,
                thumbnails            = [],
                thumbnailIndex        = 0,
                thumbnailsPerRow      = 0,
                thumbnailsAutoTimeout = null,
                thumbnailsImage       = null;

            activate();

            ///////////////

            /**
             * Initialize directive
             */
            function activate () {

                itemPosterUrl = generatePosterUrl();

                if (angular.isArray(jwCard.item.tracks)) {
                    // in the old feed api the kind is called `thumbnails` while the new feed api uses `thumbnail`.
                    thumbnailsTrack = jwCard.item.tracks.find(function (track) {
                        return track.kind === 'thumbnails' || track.kind === 'thumbnail';
                    });
                }

                if (jwCard.featured && !platform.isTouch) {

                    // bind to jwCard element
                    element.parent()
                        .on('mouseenter', cardMouseEnterHandler)
                        .on('mouseleave', cardMouseLeaveHandler);
                }

                // set watch progress
                if (scope.vm.item.feedid === dataStore.watchProgressFeed.feedid) {

                    scope.$watch(function () {
                        return jwCard.item.progress;
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            showItemProgressThumbnail();
                        }
                    });
                }

                switchToDefaultPoster();
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
             * Find child elements
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector));
            }

            /**
             * Called when the mouse enters the card element
             */
            function cardMouseEnterHandler () {

                mouseOver = true;

                // no thumbnails track available
                if (!thumbnailsTrack) {
                    return;
                }

                // thumbnails are not loaded yet
                if (!thumbnailsLoaded) {

                    return loadThumbnailData()
                        .then(function () {
                            clearTimeout(thumbnailsAutoTimeout);
                            thumbnailsAutoTimeout = setTimeout(updateToNextThumbnail, 200);
                        });
                }

                clearTimeout(thumbnailsAutoTimeout);
                thumbnailsAutoTimeout = setTimeout(updateToNextThumbnail, THUMBNAIL_AUTOMATIC_TIMEOUT);
            }

            /**
             * Called when the mouse leaves the card element
             */
            function cardMouseLeaveHandler () {

                mouseOver = false;
            }

            /**
             * Replace current poster with default item poster
             */
            function switchToDefaultPoster () {

                var posterElement;

                // show thumb of current progress when a thumbnailsTrack is defined and feedid is continue watching
                if (thumbnailsTrack && jwCard.item.feedid === dataStore.watchProgressFeed.feedid) {

                    if (!thumbnailsLoaded) {
                        return loadThumbnailData(CONTINUE_WATCHING_THUMBNAIL_QUALITY)
                            .then(showItemProgressThumbnail);
                    }

                    showItemProgressThumbnail();
                }
                else {

                    posterElement = findElement('.jw-card-poster').clone();
                    posterElement
                        .css({
                            'background':     'url(' + itemPosterUrl + ') no-repeat center',
                            'backgroundSize': 'cover'
                        });

                    replacePosterWith(posterElement);
                }
            }

            /**
             * Show thumbnail closes to the item's progress
             */
            function showItemProgressThumbnail () {

                thumbnailIndex = Math.floor(thumbnails.length * jwCard.item.progress);
                showThumbnail(thumbnails[thumbnailIndex]);
            }

            /**
             * Create a poster element from the given thumb
             * @param {Object} thumb
             */
            function showThumbnail (thumb) {

                var posterElement, x, y;

                if (!thumb) {
                    return;
                }

                posterElement = findElement('.jw-card-poster.is-active').clone();
                x             = thumb[0] / (thumbnailsImage.width - thumb[2]) * 100;
                y             = thumb[1] / (thumbnailsImage.height - thumb[3]) * 100;

                posterElement.css({
                    'background':         'url(' + thumbnailsImage.src + ') no-repeat',
                    'backgroundSize':     (100 * thumbnailsPerRow) + '%',
                    'backgroundPosition': x + '% ' + y + '%'
                });

                replacePosterWith(posterElement);
            }

            /**
             * Replace current poster with given poster element
             * @param {Object} posterElement
             */
            function replacePosterWith (posterElement) {

                var current = findElement('.jw-card-poster.is-active');

                element.prepend(posterElement);
                current.removeClass('is-active');

                setTimeout(function () {
                    findElements('.jw-card-poster:not(.is-active)').remove();
                }, 300);
            }

            /**
             * Load thumbnail WebVTT and image data
             * @param {number} [quality=120]
             * @returns {$q.promise}
             */
            function loadThumbnailData (quality) {

                var thumbnailsFile,
                    thumbnailRequest = $q.defer(),
                    thumbnailsTrackRequest;

                thumbnailsLoading = true;

                quality = quality || (scope.vm.featured ? FEATURED_CARD_THUMBNAIL_QUALITY :
                        DEFAULT_CARD_THUMBNAIL_QUALITY);

                thumbnailsFile = utils.replaceImageSize(thumbnailsTrack.file, quality);

                thumbnailsImage         = new Image();
                thumbnailsImage.onload  = function () {
                    thumbnailRequest.resolve();
                };
                thumbnailsImage.onerror = function () {
                    thumbnailRequest.reject();
                };

                thumbnailsTrackRequest = $http
                    .get(thumbnailsFile)
                    .then(thumbnailTrackLoaded);

                thumbnailsImage.crossOrigin = '';
                thumbnailsImage.src         = thumbnailsFile.replace('.vtt', '.jpg');

                return $q.all([thumbnailsTrackRequest, thumbnailRequest.promise])
                    .then(function () {
                        thumbnailsLoading = false;
                        thumbnailsLoaded  = true;
                    });
            }

            /**
             * This function gets called when the thumbnail track file is loaded
             * @param {Object} response
             * @returns {$q.promise}
             */
            function thumbnailTrackLoaded (response) {

                var parser = new WebVTT.Parser(window, WebVTT.StringDecoder()),
                    defer  = $q.defer();

                parser.oncue = function (cue) {
                    var matches = cue.text.match(/#xywh=(\d+),(\d+),(\d+),(\d+)/);
                    thumbnails.push(matches.slice(1, 5));
                };

                parser.onflush = function () {
                    if (thumbnails.length > 0) {
                        thumbnailsPerRow = 0;

                        while (thumbnails[thumbnailsPerRow][1] === '0') {
                            thumbnailsPerRow++;
                        }
                    }

                    defer.resolve();
                };

                parser.onparsingerror = function () {
                    thumbnails = [];
                    defer.reject('vtt parse error');
                };

                parser.parse(response.data);
                parser.flush();

                return defer.promise;
            }

            /**
             * Update to the next thumbnail, this functions repeats itself after the THUMBNAIL_AUTOMATIC_INTERVAL
             * timeout.
             */
            function updateToNextThumbnail () {

                if (!mouseOver) {
                    switchToDefaultPoster();
                    return;
                }

                thumbnailIndex = thumbnailIndex + 1;

                if (thumbnailIndex >= thumbnails.length - 1) {
                    thumbnailIndex = 0;
                }

                showThumbnail(thumbnails[thumbnailIndex]);

                clearTimeout(thumbnailsAutoTimeout);
                thumbnailsAutoTimeout = setTimeout(updateToNextThumbnail, THUMBNAIL_AUTOMATIC_INTERVAL);
            }

            /**
             * Generate card poster url
             * @returns {*|string}
             */
            function generatePosterUrl () {

                var width = jwCard.featured ? 1280 : 640;

                // half width when user has a small screen
                if (false === LARGE_SCREEN) {
                    width = width / 2;
                }

                return utils.replaceImageSize(jwCard.item.image, width);
            }
        }
    }

}());

