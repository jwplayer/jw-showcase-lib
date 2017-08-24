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
        .factory('bridge', bridgeService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.bridge
     *
     * @required jwShowcase.core.bridge
     */
    bridgeService.$inject = ['$timeout', '$state', 'dataStore', 'history', 'userSettings', 'sidebar', 'watchlist',
        'watchProgress', 'utils', 'config'];

    function bridgeService ($timeout, $state, dataStore, history, userSettings, sidebar, watchlist, watchProgress,
                            utils, config) {

        //window.jwShowcase.search = search;
        // window.jwShowcase.navigate = $state.go;
        // window.jwShowcase.goBack   = goBack;
        // window.jwShowcase.state    = getState;

        window.jwShowcase.state = {
            go:     $state.go,
            goBack: goBack,
            get:    getState
        };

        window.jwShowcase.config = getConfig;
        window.jwShowcase.feeds  = getFeeds;

        window.jwShowcase.settings = {
            get: getSetting,
            set: setSetting
        };

        window.jwShowcase.sidebar       = patchFunctions(sidebar);
        window.jwShowcase.watchlist     = patchFunctions(watchlist);
        window.jwShowcase.watchProgress = patchFunctions(watchProgress);

        return function () {
            window.jwShowcase.$ready();
        };

        /////////////

        function search (phrase) {
            $state.go('root.search', {
                query: utils.slugify(phrase, '+')
            });
        }

        function goBack () {
            history.goBack();
        }

        function getState () {
            return angular.copy($state.current);
        }

        function getFeeds () {
            return angular.copy(dataStore.feeds);
        }

        function getSetting (key) {
            if (key) {
                return userSettings.settings[key];
            }

            return angular.copy(userSettings.settings);
        }

        function setSetting (key, value) {
            userSettings.set(key, value);
        }

        function getConfig () {
            return angular.copy(config);
        }

        function patchFunctions (service) {

            var functions = {};

            angular.forEach(service, function (val, key) {
                if (angular.isFunction(val)) {
                    functions[key] = function () {
                        var args = arguments;
                        $timeout(function () {
                            service[key].apply(service, args);
                        });
                    };
                }
            });

            return functions;
        }
    }

}());
