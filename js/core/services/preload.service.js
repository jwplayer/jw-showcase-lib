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
     * @param {$sce} $sce
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
     *
     * @returns {$q.promise}
     */

    Preload.$inject = ['$q', '$sce', '$state', 'appStore', 'config', 'configResolver', 'cookies', 'api',
        'apiConsumer', 'serviceWorker', 'watchlist', 'watchProgress', 'userSettings'];
    function Preload ($q, $sce, $state, appStore, config, configResolver, cookies, api, apiConsumer, serviceWorker,
                      watchlist, watchProgress, userSettings) {

        var defer = $q.defer();

        // already preloaded
        if (!!config.siteName) {
            return $q.resolve();
        }

        configResolver
            .getConfig()
            .then(function (resolvedConfig) {

                angular.merge(config, resolvedConfig);

                applyConfigDefaults(config);

                if (angular.isString(config.options.backgroundColor) && '' !== config.options.backgroundColor) {
                    document.body.style.backgroundColor = config.options.backgroundColor;
                }

                if (false === config.options.enableHeader) {
                    document.body.classList.add('jw-flag-no-header');
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

            userSettings.restore();
            showCookiesNotice();

            if (serviceWorker.isSupported()) {
                serviceWorker.prefetchPlayer(jwplayer.utils.repo());
                serviceWorker.prefetchConfig(config);
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
        }

        function showCookiesNotice () {

            var isBrowser = !window.cordova;

            if (config.options.enableCookieNotice && !userSettings.settings.cookies && isBrowser) {
                cookies.show();
            }
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

                    if (!angular.isDefined(content.enableText)) {
                        content.enableText = true;
                    }

                    if (!angular.isDefined(content.enableTitle)) {
                        content.enableTitle = true;
                    }

                    if (!angular.isDefined(content.enablePreview)) {
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
    }

}());
