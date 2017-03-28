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
     * @param {jwShowcase.core.watchlist} watchlist
     * @param {jwShowcase.core.userSettings} userSettings
     *
     * @returns {$q.promise}
     */

    Preload.$inject = ['$q', '$sce', '$state', 'appStore', 'config', 'configResolver', 'cookies', 'api',
        'apiConsumer', 'watchlist', 'watchProgress', 'userSettings'];
    function Preload ($q, $sce, $state, appStore, config, configResolver, cookies, api, apiConsumer, watchlist,
                      watchProgress, userSettings) {

        var defer = $q.defer();

        // already preloaded
        if (!!config.siteName) {
            return $q.resolve();
        }

        configResolver
            .getConfig()
            .then(function (resolvedConfig) {

                // apply config
                angular.forEach(resolvedConfig, function (value, key) {

                    if (key === 'bannerImage') {
                        config[key] = $sce.trustAsResourceUrl(value);
                    }
                    else {
                        config[key] = value;
                    }
                });

                if (angular.isString(config.backgroundColor) && '' !== config.backgroundColor) {
                    document.body.style.backgroundColor = config.backgroundColor;
                }

                if (false === config.enableHeader) {
                    document.body.classList.add('jw-flag-no-header');
                }

                document.body.classList.remove('jw-flag-loading-config');

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

            if (config.enableCookieNotice && !userSettings.settings.cookies && isBrowser) {
                cookies.show();
            }
        }
    }

}());
