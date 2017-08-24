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
        .run(run)
        .config(config);

    config.$inject = ['$stateProvider', '$urlMatcherFactoryProvider', '$touchProvider', 'seoProvider',
        'historyProvider'];
    function config ($stateProvider, $urlMatcherFactoryProvider, $touchProvider, seoProvider, historyProvider) {

        if ('ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch)) {
            $touchProvider.ngClickOverrideEnabled(true);
        }

        $urlMatcherFactoryProvider
            .strictMode(false);

        historyProvider
            .setDefaultState('root.dashboard');

        $stateProvider
            .state('root', {
                abstract:    true,
                resolve:     {
                    configure: ['configResolver', 'config', function (configResolver, config) {
                        return configResolver.getConfig();
                    }],
                    bootstrap: ['configure', 'bootstrap', function(configure, bootstrap) {
                        return bootstrap;
                    }]
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
    }

    run.$inject = ['$document', 'history', 'platform'];
    function run ($document, history, platform) {

        history.attach();
        platform.prepare();

        $document.on('keyup', function (evt) {
            if (9 === evt.which) {
                document.body.classList.remove('jw-flag-no-focus');
            }
        });

        $document.on('click', function () {
            document.body.classList.add('jw-flag-no-focus');
        });
    }

}());
