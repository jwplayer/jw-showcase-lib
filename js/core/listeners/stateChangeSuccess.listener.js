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
        .run(registerListener);

    registerListener.$inject = ['$rootScope', '$q', 'appStore'];
    function registerListener ($rootScope, $q, appStore) {

        $rootScope.$on('$stateChangeSuccess', function (event, toState) {

            $q.resolve().then(function () {
                if (toState.scrollTop === 'last' && appStore.scrollTopCache[toState.name]) {
                    document.body.scrollTop = appStore.scrollTopCache[toState.name];
                }
                else if (angular.isNumber(toState.scrollTop)) {
                    document.body.scrollTop = toState.scrollTop;
                }
            });
        });
    }

}());
