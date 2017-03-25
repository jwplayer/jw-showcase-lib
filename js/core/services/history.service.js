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
        .provider('history', HistoryProvider);

    HistoryProvider.$inject = [];
    function HistoryProvider () {

        var defaultState = '';

        this.setDefaultState = function (state) {
            defaultState = state;
        };

        this.$get = History;

        History.$inject = ['$rootScope', '$state'];
        function History ($rootScope, $state) {

            var self = this;

            this.history   = [];
            this.add       = add;
            this.goToIndex = goToIndex;
            this.goBack    = goBack;

            activate();

            //////////////

            function activate () {

                $rootScope.$on('$stateChangeSuccess', function (event, fromState, fromParams, toState, toParams) {
                    if (fromState && fromParams && fromState.name) {
                        add(toState.name, toParams);
                    }
                });
            }

            /**
             * Add state to history
             * @param {string} name
             * @param {Object} params
             */
            function add (name, params) {

                self.history.unshift([name, params]);
                self.history.splice(15);
            }

            /**
             * Go to state in history
             * @param {number} index
             */
            function goToIndex (index) {

                var item = self.history[index];

                if (item) {
                    $state.go(item[0], item[1]);
                    self.history.splice(0, index);
                }
            }

            function goBack () {

                var history = self.history;

                // fallback to root.dashboard
                if (history.length < 2) {
                    return $state.go(defaultState);
                }

                // go back
                self.goToIndex(1);
            }

            return this;
        }
    }



}());
