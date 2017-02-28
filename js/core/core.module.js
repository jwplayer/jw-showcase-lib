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
     * @name jwShowcase.core
     *
     * @description
     * Application's core module
     */
    angular
        .module('jwShowcase.core', [])
        .constant('DEFAULT_CONTENT_SERVICE', 'https://content.jwplatform.com')
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlMatcherFactoryProvider', 'seoProvider', '$ionicConfigProvider'];
    function config ($stateProvider, $urlMatcherFactoryProvider, seoProvider, $ionicConfigProvider) {

        var platform = ionic.Platform;

        platform.isMobile = platform.isIOS() || platform.isAndroid() || platform.isWindowsPhone();

        $urlMatcherFactoryProvider
            .strictMode(false);

        $stateProvider
            .state('root', {
                abstract:    true,
                resolve:     {
                    preload: preloadApp
                },
                templateUrl: 'views/core/root.html'
            });


        seoProvider
            .otherwise(['$location', 'config', function ($location, config) {
                return {
                    title:       config.siteName,
                    description: config.description,
                    canonical:   $location.absUrl()
                };
            }]);

        // always use large toggle's
        $ionicConfigProvider.form.toggle = function () {
            return 'large';
        };

        $ionicConfigProvider.views.transition('none');

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
         * @param {DEFAULT_CONTENT_SERVICE} DEFAULT_CONTENT_SERVICE
         *
         * @returns {$q.promise}
         */
        preloadApp.$inject = ['$q', '$sce', '$state', 'appStore', 'config', 'configResolver', 'cookies', 'api',
            'apiConsumer', 'dataStore', 'FeedModel', 'watchlist', 'watchProgress', 'userSettings',
            'DEFAULT_CONTENT_SERVICE'];
        function preloadApp ($q, $sce, $state, appStore, config, configResolver, cookies, api, apiConsumer, dataStore,
                             FeedModel, watchlist, watchProgress, userSettings, DEFAULT_CONTENT_SERVICE) {

            var defer = $q.defer();

            // already preloaded
            if (!!config.siteName) {
                return $q.resolve();
            }

            configResolver
                .getConfig()
                .then(function (resolvedConfig) {

                    var feedPromises = [],
                        model, promise;

                    // apply config
                    angular.forEach(resolvedConfig, function (value, key) {

                        if (key === 'bannerImage') {
                            config[key] = $sce.trustAsResourceUrl(value);
                        }
                        else {
                            config[key] = value;
                        }
                    });

                    if (!config.contentService) {
                        config.contentService = DEFAULT_CONTENT_SERVICE;
                    }

                    if (angular.isString(config.backgroundColor) && '' !== config.backgroundColor) {
                        document.body.style.backgroundColor = config.backgroundColor;
                    }

                    if (false === config.enableHeader) {
                        document.body.classList.add('jw-flag-no-header');
                    }

                    if (angular.isDefined(config.enableJsScroll)) {
                        $ionicConfigProvider.scrolling.jsScrolling(config.enableJsScroll);
                    }

                    if (angular.isString(config.featuredPlaylist) && config.featuredPlaylist !== '') {
                        model = new FeedModel(config.featuredPlaylist);

                        feedPromises.push(apiConsumer.populateFeedModel(model));
                        dataStore.featuredFeed = model;
                    }

                    if (angular.isArray(config.playlists)) {

                        dataStore.feeds = config.playlists.map(function (feedId) {
                            model   = new FeedModel(feedId);
                            promise = apiConsumer
                                .populateFeedModel(model)
                                .then(null, function (error) {

                                    // show error, but resolve so we can wait for all feeds to be loaded
                                    console.error(error);
                                    return $q.resolve();
                                });

                            feedPromises.push(promise);
                            return model;
                        });
                    }

                    // don't wait for the feeds but we want to populate the watchlist and watchProgress feeds after
                    // feeds are loaded
                    $q.all(feedPromises)
                        .then(handleFeedsLoadSuccess);

                    api.getPlayer(config.player)
                        .then(handlePreloadSuccess, handlePreloadError);

                }, handlePreloadError);

            return defer.promise;

            //////////////////

            function handlePreloadSuccess () {

                userSettings.restore();
                cookies.showIfNeeded();

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
        }
    }

    run.$inject = ['$rootScope', '$state', 'config'];
    function run ($rootScope, $state, config) {

        if ('ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch)) {
            angular.element(document.body).addClass('platform-touch');
        }

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

            // prevent users going to search page when no searchPlaylist is defined
            if (toState.name === 'root.search' && !config.searchPlaylist) {
                event.preventDefault();
                $state.go('root.dashboard');
            }
        });

        $rootScope.$on('$stateChangeError', function (event, toState) {

            var name = toState.name;

            event.preventDefault();

            // prevent loop if something is wrong in error or root.404 state

            if (name === 'error' || name === 'root.videoNotFound' || name === 'root.feedNotFound') {
                return;
            }

            if (name === 'root.feed') {
                $state.go('root.feedNotFound');
            }
            else if (name === 'root.video') {
                $state.go('root.videoNotFound');
            }
            else if (name !== 'root.dashboard') {
                $state.go('root.dashboard');
            }
        });
    }

}());
