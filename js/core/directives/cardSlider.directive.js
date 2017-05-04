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

    var DEFAULT_COLS          = {'xs': 1, 'sm': 2, 'md': 3, 'lg': 4, 'xl': 5};
    var DEFAULT_COLS_FEATURED = 1;

    angular
        .module('jwShowcase.core')
        .directive('jwCardSlider', cardSliderDirective);

    /**
     * @ngdoc directive
     * @name jwShowcase.core.directive:jwCardSlider
     * @module jwShowcase.core
     *
     * @description
     * # jwCardSlider
     * The `jwCardSlider` can be used to create a horizontal list of cards which can be moved horizontally. Each item
     * will be rendered in the {@link jwShowcase.core.directive:jwCard `jwCard`} directive.
     *
     * @scope
     *
     * @param {jwShowcase.core.feed}    feed            Feed which will be displayed in the slider.
     * @param {boolean=}                featured        Featured slider flag
     * @param {function=}               onCardClick     Function which is being called when the user clicks on a card.
     * @param {string=}                 title           Overrule title from {@link jwShowcase.core.feed}
     *
     * @requires $compile
     * @requires $templateCache
     * @requires jwShowcase.core.utils
     *
     * @example
     *
     * ```
     * <jw-card-slider feed="vm.feed" cols="1" featured="true"></jw-card-slider>
     * <jw-card-slider feed="vm.feed" cols="{xs: 2, sm: 3}" featured="false" heading="'Videos'"></jw-card-slider>
     * ```
     */
    cardSliderDirective.$inject = ['$compile', '$templateCache', 'utils'];
    function cardSliderDirective ($compile, $templateCache, utils) {

        return {
            scope:            {
                feed:        '=',
                featured:    '=',
                onCardClick: '=',
                title:       '@'
            },
            replace:          true,
            controller:       angular.noop,
            controllerAs:     'vm',
            bindToController: true,
            templateUrl:      'views/core/cardSlider.html',
            link:             link
        };

        function link (scope, element) {

            var sliderList             = findElement('.jw-card-slider-list'),
                resizeHandlerDebounced = utils.debounce(resizeHandler, 100),
                slideTemplate          = $templateCache.get('views/core/cardSliderSlide.html'),
                index                  = 0,
                leftSlidesVisible      = false,
                sliderCanSlide         = false,
                sliding                = false,
                userIsSliding          = false,
                startCoords            = {},
                sliderMap              = [],
                totalItems             = 0,
                itemsVisible           = 0,
                itemsMargin            = 1,
                animation;

            scope.vm.slideLeft  = slideLeft;
            scope.vm.slideRight = slideRight;

            activate();

            /**
             * Initialize the directive.
             */
            function activate () {

                var classNameSuffix = scope.vm.featured ? 'featured' : 'default',
                    className       = 'jw-card-slider-flag-' + classNameSuffix,
                    loading         = scope.vm.feed.loading;

                element.addClass(className);

                if (scope.vm.feed.aspectratio) {
                    element.addClass('jw-card-slider-' + scope.vm.feed.aspectratio.replace(':', ''));
                }

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.title || scope.vm.feed.title || 'loading';
                }

                scope.$on('$destroy', destroyHandler);
                window.addEventListener('resize', resizeHandlerDebounced);
                findElement('.jw-card-slider-align')[0].addEventListener('touchstart', onTouchStart, false);

                scope.$watch(function () {
                    return scope.vm.feed;
                }, feedUpdateHandler, true);

                if (scope.vm.feed) {
                    totalItems = scope.vm.feed.playlist.length;
                }

                if (loading) {
                    element.addClass('jw-card-slider-flag-loading');
                    renderLoadingSlides();
                }

                resizeHandler();
            }

            /**
             * Find child element by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElement (selector) {

                return angular.element(element[0].querySelector(selector));
            }

            /**
             * Find child elements by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector));
            }

            /**
             * Clean up
             */
            function destroyHandler () {

                window.removeEventListener('resize', resizeHandlerDebounced);
                findElement('.jw-card-slider-align')[0].removeEventListener('touchstart', onTouchStart);
            }

            /**
             * Gets called when the feed gets updated
             */
            function feedUpdateHandler (newValue, oldValue) {

                // set slider background color
                element.css('background-color', scope.vm.feed.backgroundColor || '');

                if (!feedHasChanged(newValue, oldValue)) {
                    return;
                }

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.title || scope.vm.feed.title;
                }

                totalItems = scope.vm.feed.playlist.length;

                element.toggleClass('jw-card-slider-flag-loading', scope.vm.feed.loading);

                resizeHandler(true);
            }

            /**
             * Returns true if the feeds has changed and needs to re render
             * @param {jwShowcase.core.feed} newValue
             * @param {jwShowcase.core.feed} oldValue
             * @returns {boolean}
             */
            function feedHasChanged (newValue, oldValue) {

                return !comparePlaylist(newValue.playlist, oldValue.playlist) || !!newValue.error;
            }

            /**
             * Compare the two given playlists on their $key property
             * @param {jwShowcase.core.item[]} playlist
             * @param {jwShowcase.core.item[]} prevPlaylist
             * @returns {boolean}
             */
            function comparePlaylist (playlist, prevPlaylist) {

                var playlistMap     = playlist.map(function (item) {
                        return item.$key;
                    }),
                    prevPlaylistMap = prevPlaylist.map(function (item) {
                        return item.$key;
                    });

                return angular.equals(playlistMap, prevPlaylistMap);

            }

            /**
             * Handle resize event
             */
            function resizeHandler (forceRender) {

                var newItemsVisible = getItemsVisible(),
                    needsRender     = newItemsVisible !== itemsVisible;

                itemsVisible   = newItemsVisible;
                itemsMargin    = newItemsVisible + 1;
                sliderCanSlide = totalItems > itemsVisible;

                sliderList.attr('class', 'jw-card-slider-list slides-' + itemsVisible);

                leftSlidesVisible = scope.vm.featured;

                if (!sliderCanSlide) {
                    index             = 0;
                    leftSlidesVisible = false;
                }

                findElements('.jw-card-slider-button').toggleClass('ng-hide', !sliderCanSlide);

                if (forceRender || needsRender) {

                    if (scope.vm.feed.error) {
                        renderErrorSlides();
                    }
                    else if (scope.vm.feed.loading) {
                        renderLoadingSlides();
                    }
                    else {
                        renderSlides();
                    }
                }

                moveSlider(0, false);
            }

            /**
             * Get items items visible
             * @returns {string|number|Object|string|Number}
             */
            function getItemsVisible () {

                var cols = scope.vm.feed.cols;

                if (!angular.isDefined(cols)) {
                    cols = scope.vm.featured ? DEFAULT_COLS_FEATURED : DEFAULT_COLS;
                }

                return angular.isNumber(cols) ? cols : utils.getValueForScreenSize(cols, 1);
            }

            /**
             * Render custom slides
             * @param {string} templateUrl
             * @param {number} count
             */
            function renderCustomSlides (templateUrl, count) {

                var holder   = angular.element('<div></div>'),
                    template = $templateCache.get(templateUrl),
                    dummy;

                count = count || 5;

                for (var i = 0; i < count; i++) {
                    dummy = angular.element(template);
                    dummy.children().eq(0).addClass('jw-card-flag-' + (scope.vm.featured ? 'featured' : 'default'));
                    holder.append(dummy);
                }

                sliderList
                    .html('')
                    .append(holder.children());
            }

            /**
             * Render loading slides
             */
            function renderLoadingSlides () {

                renderCustomSlides('views/core/cardSliderLoadingSlide.html', 6);

                element.addClass('jw-card-slider-flag-loading');
            }

            /**
             * Render error slides
             */
            function renderErrorSlides () {

                renderCustomSlides('views/core/cardSliderErrorSlide.html', 6);

                scope.vm.heading = 'Missing feed';

                element.addClass('jw-card-slider-flag-error');
            }

            /**
             * Render slides
             */
            function renderSlides () {

                var nextSliderMap = [],
                    nextSliderList;

                // create visible slides first so these will be used from the cache with priority. E.g. prevents render
                // of visible cards.
                nextSliderList = createSlidesForRange(index, itemsVisible);

                // only if the slider can slide, render the left and right slides
                if (sliderCanSlide) {

                    // create slides left from visible slides if user has slided
                    if (leftSlidesVisible) {
                        nextSliderList = createSlidesForRange(index - itemsMargin, itemsMargin)
                            .concat(nextSliderList);
                    }

                    // create slides right from visible slides
                    nextSliderList = nextSliderList
                        .concat(createSlidesForRange(index + itemsVisible, itemsMargin));
                }

                destroySlides();

                for (var i = 0, len = nextSliderList.length; i < len; i++) {
                    sliderList.append(nextSliderList[i]);
                }

                sliderMap = nextSliderMap;

                updateVisibleSlides();
                findElement('.jw-card-slider-button-flag-left').toggleClass('is-disabled', !leftSlidesVisible);

                ///////////

                function createSlidesForRange (from, count) {

                    var itemIndex = from,
                        list      = [],
                        item, slide;

                    if (itemIndex < 0) {
                        itemIndex += totalItems;
                    }

                    for (var slideIndex = 0; slideIndex < count; slideIndex++) {

                        if (itemIndex > totalItems - 1) {
                            if (!sliderCanSlide) {
                                break;
                            }

                            itemIndex = 0;
                        }

                        item  = scope.vm.feed.playlist[itemIndex];
                        slide = findExistingSlide(item) || createSlide(item);

                        addClassNamesToSlide(slide, itemIndex);
                        list.push(slide);

                        itemIndex++;
                    }

                    return list;
                }

                function createSlide (item) {

                    var slide = compileSlide(item);
                    nextSliderMap.push({
                        key: item.$key,
                        el:  slide
                    });

                    return slide;
                }

                function addClassNamesToSlide (slide, itemIndex) {

                    slide.removeClass('first last');

                    if (itemIndex === 0) {
                        slide.addClass('first');
                    }
                    else if (itemIndex === totalItems - 1) {
                        slide.addClass('last');
                    }

                }

                function findExistingSlide (item) {

                    var mapIndex = sliderMap.length,
                        slide;

                    while (mapIndex--) {
                        if (sliderMap[mapIndex].key === item.$key) {
                            slide = sliderMap[mapIndex].el;
                            nextSliderMap.push(sliderMap[mapIndex]);
                            sliderMap.splice(mapIndex, 1);
                            return slide;
                        }
                    }
                }

                function destroySlides () {

                    // remove cards in slider
                    var list = sliderList[0];
                    while (list.firstChild) {
                        list.removeChild(list.firstChild);
                    }

                    // destroy cards $scope from cache
                    sliderMap.forEach(function (item) {
                        if (item.el.scope()) {
                            item.el.scope().$destroy();
                        }
                    });
                }
            }

            /**
             * Set visible classNames to slides
             * @param {number} [offset=0]
             */
            function updateVisibleSlides (offset) {

                var from = leftSlidesVisible ? itemsMargin : 0,
                    to   = from + itemsVisible;

                if (angular.isNumber(offset)) {
                    from += offset;
                    to += offset;
                }

                angular.forEach(findElement('.jw-card-slider-list').children(), function (slide, slideIndex) {
                    slide.classList.toggle('is-visible', slideIndex >= from && slideIndex < to);
                });
            }

            /**
             * Compile a slide
             * @param {jwShowcase.core.item} item
             * @returns {angular.element}
             */
            function compileSlide (item) {

                var childScope = scope.$new(false, scope);

                childScope.item = item;

                return $compile(angular.element(slideTemplate))(childScope);
            }

            /**
             * Slide to the left
             */
            function slideLeft () {

                var toIndex   = index === 0 ? totalItems - itemsVisible : Math.max(0, index - itemsVisible),
                    slideCols = index - toIndex;

                if (sliding || !leftSlidesVisible) {
                    return;
                }

                if (slideCols < 0) {
                    slideCols = (index + totalItems) - toIndex;
                }

                index = toIndex;

                updateVisibleSlides(-slideCols);

                moveSlider((slideCols / itemsVisible) * 100, true, function () {
                    renderSlides();
                    moveSlider(0, false);
                });
            }

            /**
             * Slide to the right
             */
            function slideRight () {

                var toIndex   = index + itemsVisible,
                    maxIndex  = totalItems - itemsVisible,
                    slideCols = itemsVisible;

                if (sliding) {
                    return;
                }

                if (index === maxIndex) {
                    toIndex = 0;
                }
                else if (toIndex >= maxIndex) {
                    toIndex   = maxIndex;
                    slideCols = toIndex - index;
                }

                index = toIndex;

                updateVisibleSlides(slideCols);

                moveSlider(((slideCols / itemsVisible) * 100) * -1, true, function () {

                    leftSlidesVisible = true;

                    renderSlides();
                    moveSlider(0, false);
                });
            }

            /**
             * Move the slider to the given offset with or without animation.
             * @param {number} offset Offset
             * @param {boolean} animate Animate flag
             * @param {Function} [callback] Callback when slider has moved
             */
            function moveSlider (offset, animate, callback) {

                var listElement = findElement('.jw-card-slider-list');

                sliding = true;

                if (animation && animation._active) {
                    animation.kill();
                }

                if (leftSlidesVisible) {
                    offset -= itemsMargin / itemsVisible * 100;
                }

                animation = window.TweenLite
                    .to(listElement, animate ? 0.3 : 0, {
                        x: offset + '%', z: 0.01, onComplete: onSlideComplete
                    });

                function onSlideComplete () {

                    sliding = false;

                    setTimeout(function () {
                        if (angular.isFunction(callback)) {
                            callback();
                        }
                    }, 1);
                }
            }

            /**
             * Handle touchstart event
             * @param {Event} event
             * @todo detect isAndroid4
             */
            function onTouchStart (event) {

                var isAndroid4     = false,
                    coords         = getCoords(event),
                    touchContainer = findElement('.jw-card-slider-align')[0];

                touchContainer.addEventListener('touchmove', onTouchMove);
                touchContainer.addEventListener('touchend', onTouchEnd);
                touchContainer.addEventListener('touchcancel', onTouchCancel);

                startCoords = coords;
                element.addClass('is-sliding');

                if (true === isAndroid4) {
                    event.preventDefault();
                }
            }

            /**
             * Handle touchmove event
             * @param {Event} event
             */
            function onTouchMove (event) {

                var coords         = getCoords(event),
                    distanceX      = startCoords.x - coords.x,
                    distanceY      = startCoords.y - coords.y,
                    deltaX         = Math.abs(distanceX),
                    deltaY         = Math.abs(distanceY),
                    sliderWidth    = findElement('.jw-card-slider-list')[0].offsetWidth,
                    containerWidth = findElement('.jw-card-slider-container')[0].offsetWidth;

                if (animation && animation._active) {
                    return;
                }

                if (!userIsSliding) {
                    if (deltaY > 20) {
                        afterTouchEnd();
                        moveSlider(0, true);
                    }
                    else if (deltaX > 20) {
                        userIsSliding = true;
                    }
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                // first item
                if (!leftSlidesVisible && distanceX < 0) {
                    distanceX = Math.min(50, easeOutDistance(deltaX, containerWidth)) * -1;
                }
                // last item
                else if (!sliderCanSlide && distanceX > 0) {
                    distanceX = Math.min(50, easeOutDistance(deltaX, containerWidth));
                }

                var percentageOffset = (distanceX / sliderWidth) * 100;

                moveSlider(-percentageOffset, false);
            }

            /**
             * Handle touchend event
             * @param {Event} event
             */
            function onTouchEnd (event) {

                var coords   = getCoords(event),
                    distance = startCoords.x - coords.x;

                if (distance < -50 && leftSlidesVisible) {
                    slideLeft();
                }
                else if (distance > 50 && sliderCanSlide) {
                    slideRight();
                }
                else {
                    moveSlider(0, true);
                }

                afterTouchEnd();
            }

            /**
             * Handle touchcancel event
             */
            function onTouchCancel () {

                moveSlider(0, true);
                afterTouchEnd();
            }

            /**
             * Remove touch event listeners and remove className 'is-hiding'
             */
            function afterTouchEnd () {

                var touchContainer = findElement('.jw-card-slider-align')[0];

                startCoords = null;

                touchContainer.removeEventListener('touchmove', onTouchMove);
                touchContainer.removeEventListener('touchend', onTouchEnd);
                touchContainer.removeEventListener('touchcancel', onTouchCancel);

                userIsSliding = false;

                element.removeClass('is-sliding');
            }

            /**
             * Get coords object from native touch event. Original code from ngTouch.
             *
             * @param {Event} event
             * @returns {{x: (number), y: (number)}}
             */
            function getCoords (event) {

                var originalEvent = event.originalEvent || event,
                    touches       = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches
                        : [originalEvent],
                    e             = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

                return {
                    x: e.clientX,
                    y: e.clientY
                };
            }

            /**
             * Ease out the given distance
             *
             * @param {number} current Current distance
             * @param {number} total Total distance
             * @returns {number}
             */
            function easeOutDistance (current, total) {

                return Math.sin((0.5 / total) * current) * current;
            }
        }
    }

}());
