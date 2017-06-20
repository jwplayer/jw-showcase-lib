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
        .factory('bootstrap', Bootstrap);

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

    Bootstrap.$inject = ['$q', '$state', 'appStore', 'config', 'cookies', 'api',
        'apiConsumer', 'serviceWorker', 'watchlist', 'watchProgress', 'userSettings'];
    function Bootstrap ($q, $state, appStore, config, cookies, api, apiConsumer, serviceWorker,
                      watchlist, watchProgress, userSettings) {

        var defer = $q.defer();

        signPlaylists(config.content)
            .then(function () {
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

                return apiConsumer
                    .loadFeedsFromConfig();

            }, handlePreloadError)
            .then(function () {

                watchlist.restore();
                watchProgress.restore();

            });

        return defer.promise;

        //////////////////

        function signPlaylists(content) {
            if (!config.options.useSigning) {
                content.forEach(function (item) {
                    item.playlistUri = '/v2/playlists/' + item.playlistId;
                });

                return Promise.resolve();
            }

            if (!config.options.firebase) {
                throw new Error('Missing firebase options.');
            }

            var signingMap = {};
            var signingPayload = [];

            content.forEach(function (target, index) {
                if (!target.signable) {
                    return;
                }

                signingMap[signingPayload.push({id: target.playlistId}) - 1] = index;
            });

            return api.getSignedFeed(signingPayload).then(function(response) {
                if (!response) {
                    // @todo handle this.
                    return content;
                }

                Object.getOwnPropertyNames(signingMap).forEach(function (mapIndex) {
                    content[signingMap[mapIndex]].playlistUri = response[mapIndex] ;
                });

                return content;
            });
        }

        function handlePreloadSuccess () {

            $q.all([
                userSettings.restore()
            ]).then(defer.resolve);

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

        function showCookiesNotice () {

            var isBrowser = !window.cordova;

            if (config.options.enableCookieNotice && !userSettings.settings.cookies && isBrowser) {
                cookies.show();
            }
        }
    }

}());
