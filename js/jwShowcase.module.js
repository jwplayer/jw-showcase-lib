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

    /**
     * @ngdoc overview
     * @name jwShowcase
     */
    angular
        .module('jwShowcase', [
            'jwShowcase.core',
            'jwShowcase.error',
            'jwShowcase.dashboard',
            'jwShowcase.feed',
            'jwShowcase.search',
            'jwShowcase.tag',
            'jwShowcase.video'
        ])
        .value('config', {
            contentService: 'https://content.jwplatform.com',
            options:        {
                enableContinueWatching:    true,
                enableCookieNotice:        false,
                enableFeaturedText:        true,
                enablePlayerAutoFocus:     true,
                enableHeader:              true,
                enableFooter:              true,
                enableTags:                false,
                enableGlobalSearch:        false,
                enableAddToHome:           false,
                rightRail:                 {
                    enabled: false
                },
                videoTitlePosition:        'below',
                useRecommendationPlaylist: false,
                displayAds:                false
            }
        });

    /**
     * @name jwShowcase.config
     * @type {Object}
     *
     * @property {string}               version
     * @property {string}               player
     * @property {string}               theme
     * @property {string}               siteName
     * @property {string}               description
     * @property {string}               bannerImage
     * @property {string}               footerText
     *
     * @property {string}               searchPlaylist
     * @property {string}               recommendationsPlaylist
     *
     * @property {Object}               assets
     * @property {string}               assets.banner
     *
     * @property {jwShowcase.content[]} content
     *
     * @property {Object}               options
     * @property {string}               options.backgroundColor
     * @property {string}               options.highlightColor
     * @property {boolean}              options.enableHeader
     * @property {boolean}              options.enableFooter
     * @property {boolean}              options.enableContinueWatching
     * @property {boolean}              options.enableCookieNotice
     * @property {boolean}              options.enablePlayerAutoFocus
     * @property {string}               options.videoTitlePosition
     *
     * @property {Object|boolean}       options.rightRail
     * @property {boolean}              options.rightRail.enabled
     *
     * @property {Object|boolean}       options.displayAds
     * @property {string}               options.displayAds.client
     * @property {Array}                options.displayAds.slots
     */

    /**
     * @name jwShowcase.content
     * @type {Object}
     *
     * @property {string}           playlistId
     * @property {boolean}          featured
     * @property {number|Object}    cols
     * @property {boolean}          enableText
     * @property {boolean}          enableTitle
     * @property {boolean}          enablePreview
     * @property {string}           backgroundColor
     */

}());
