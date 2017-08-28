/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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
        .factory('preload', Preload);

    /**
     * Preload application data
     *
     * @param {$q} $q
     * @param {$state} $state
     * @param {jwShowcase.core.appStore} appStore
     * @param {jwShowcase.config} config
     * @param {jwShowcase.core.configResolver} configResolver
     * @param {jwShowcase.core.cookies} cookies
     * @param {jwShowcase.core.api} api
     * @param {jwShowcase.core.apiConsumer} apiConsumer
     * @param {jwShowcase.core.watchlist} serviceWorker
     * @param {jwShowcase.core.watchlist} watchlist
     * @param {jwShowcase.core.userSettings} userSettings
     * @param {jwShowcase.core.utils} utils
     *
     * @returns {$q.promise}
     */

    Preload.$inject = ['$q', '$state', 'appStore', 'config', 'configResolver', 'cookies', 'api', 'dfp',
        'apiConsumer', 'serviceWorker', 'watchlist', 'watchProgress', 'userSettings', 'bridge', 'utils'];
    function Preload ($q, $state, appStore, config, configResolver, cookies, api, dfp, apiConsumer, serviceWorker,
                      watchlist, watchProgress, userSettings, bridge, utils) {

        var defer = $q.defer();

        // already preloaded
        if (!!config.siteName) {
            return $q.resolve();
        }

        configResolver
            .getConfig()
            .then(function (resolvedConfig) {
                return angular.isFunction(window.configLoaded) ? window.configLoaded(resolvedConfig) : resolvedConfig;
            })
            .then(function (resolvedConfig) {

                mergeSetValues(config, resolvedConfig);
                applyConfigDefaults(config);

                if (angular.isString(config.options.backgroundColor) && '' !== config.options.backgroundColor) {
                    document.body.style.backgroundColor = config.options.backgroundColor;
                }

                if (false === config.options.enableHeader) {
                    document.body.classList.add('jw-flag-no-header');
                }

                if (config.options.highlightColor) {
                    setHighlightColor(config.options.highlightColor);
                }

                if (angular.isObject(config.options.displayAds) && config.options.displayAds.client === 'dfp') {
                    dfp.setup();
                }

                setTimeout(function () {
                    document.body.classList.remove('jw-flag-loading-config');
                });

                api.getPlayer(config.player)
                    .then(handlePreloadSuccess, handlePreloadError);

                apiConsumer
                    .loadFeedsFromConfig()
                    .then(handleFeedsLoadSuccess);

            }, handlePreloadError);

        return defer.promise;

        //////////////////

        function handlePreloadSuccess () {

            var pwa = window.enablePwa && 'serviceWorker' in navigator;

            userSettings.restore();
            showCookiesNotice();

            if (serviceWorker.isSupported()) {
                serviceWorker.prefetchPlayer(jwplayer.utils.repo());
                serviceWorker.prefetchConfig(config);
            }

            // show add to homescreen when PWA is disabled
            if (config.options.enableAddToHome && !window.cordova && !pwa) {
                window.addToHomescreen({appID: 'jwshowcase.addtohome'});
            }

            defer.resolve();
        }

        function handlePreloadError (error) {

            appStore.loading = false;

            $state.go('error', {
                message: error.message
            });

            defer.reject();
        }

        function handleFeedsLoadSuccess () {

            watchlist.restore();
            watchProgress.restore();

            bridge.initialize();
        }

        function showCookiesNotice () {

            var isBrowser = !window.cordova;

            if (config.options.enableCookieNotice && !userSettings.settings.cookies && isBrowser) {
                cookies.show();
            }
        }

        function setHighlightColor (color) {

            var bgClassNames    = [
                    '.jw-button-primary',
                    '.jw-card-watch-progress',
                    '.jw-card-toast-primary',
                    '.jw-offline-message',
                    '.jw-skin-jw-showcase .jw-progress'
                ],
                colorClassNames = [
                    '.jw-button-default:hover',
                    '.jw-button-default.active',
                    '.jw-button-play .jwy-icon',
                    '.jw-button-share:hover .jwy-icon-stack .jwy-icon',
                    '.jw-button-watchlist.is-active .jwy-icon-stack',
                    '.jw-button-watchlist:not(.is-active):hover .jwy-icon-stack .jwy-icon',
                    '.jw-cookies-title',
                    '.jw-loading .jw-loading-icon .jwy-icon',
                    '.jw-skin-jw-showcase .jw-button-color:hover',
                    '.jw-skin-jw-showcase .jw-toggle.jw-off:hover',
                    '.jw-skin-jw-showcase .jw-toggle:not(.jw-off)'
                ];

            utils.addStylesheetRules([
                [bgClassNames.join(','), ['background-color', color, true]],
                [colorClassNames.join(','), ['color', color, true]]
            ]);
        }

        /**
         * Apply the config defaults and fixtures
         * @param config
         * @returns {*}
         */
        function applyConfigDefaults (config) {

            if (angular.isArray(config.content)) {

                // add continue watching feed if its not defined
                if (config.options.enableContinueWatching && !containsPlaylistId(config.content, 'continue-watching')) {

                    // when first feed is featured we place the continue watching slider after that
                    var index = config.content[0] && config.content[0].featured ? 1 : 0;

                    // insert at index
                    config.content.splice(index, 0, {
                        playlistId: 'continue-watching'
                    });
                }

                // add saved videos feed if its not defined
                if (!containsPlaylistId(config.content, 'saved-videos')) {

                    // add as last slider
                    config.content.push({
                        playlistId: 'saved-videos'
                    });
                }

                // make sure each content has the default settings
                config.content = config.content.map(function (content) {

                    if (!isSet(content.enableText)) {
                        content.enableText = true;
                    }

                    if (!isSet(content.enableTitle)) {
                        content.enableTitle = true;
                    }

                    if (!isSet(content.enablePreview)) {
                        content.enablePreview = content.playlistId === 'continue-watching' || !!content.featured;
                    }

                    return content;
                });
            }

            return config;
        }

        /**
         * Test if collection contains a playlist id
         * @param collection
         * @param id
         * @returns {boolean}
         */
        function containsPlaylistId (collection, id) {
            return collection.findIndex(function (current) {
                    return current.playlistId === id;
                }) > -1;
        }

        /**
         * Returns true if value is defined and not null
         * @param {*} value
         * @returns {boolean}
         */
        function isSet (value) {
            return angular.isDefined(value) && value !== null;
        }

        /**
         * Merge values that are defined and not null
         * @param {Object} destination
         * @param {Object} source
         */
        function mergeSetValues (destination, source) {

            angular.forEach(source, function (value, key) {

                if (angular.isObject(value) && angular.isObject(destination[key])) {
                    return mergeSetValues(destination[key], value);
                }

                if (isSet(value)) {
                    destination[key] = value;
                }
            });
        }
    }

}());
