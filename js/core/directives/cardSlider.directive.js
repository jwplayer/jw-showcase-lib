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
     * @param {Object|number=}          cols            How many columns should be visible. Can either be a fixed number or
     *                                                  an object with responsive columns (e.g. `{sm: 2, md: 4}`).
     *                                                  Available sizes; xs, sm, md, lg and xl.
     *
     * @param {boolean=}                featured        Featured slider flag
     * @param {function=}               onCardClick     Function which is being called when the user clicks on a card.
     * @param {object=}                 delegate        Exposes a small api to control the cardSlider.
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
                cols:        '=',
                featured:    '=',
                onCardClick: '=',
                delegate:    '=?'
            },
            replace:          true,
            controller:       angular.noop,
            controllerAs:     'vm',
            bindToController: true,
            templateUrl:      'views/core/cardSlider.html',
            link:             link
        };

        function link (scope, element) {

            var sliderList             = findElements('.jw-card-slider-list'),
                resizeHandlerDebounced = utils.debounce(resizeHandler, 100),
                dummySlideTemplate     = $templateCache.get('views/core/cardSliderDummySlide.html'),
                slideTemplate          = $templateCache.get('views/core/cardSliderSlide.html'),
                index                  = 0,
                sliderHasMoved         = false,
                sliderCanSlide         = false,
                sliding                = false,
                userIsSliding          = false,
                startCoords            = {},
                totalItems             = 0,
                itemsVisible           = 1,
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


                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.feed.title || 'loading';
                }
                else {
                    findElement('.jw-card-slider-indicator').removeClass('ng-hide');
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
                    renderDummySlides();
                }

                resizeHandler();
            }

            /**
             * Find child element by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElement (selector) {

                return angular.element(element[0].querySelector(selector))
            }

            /**
             * Find child elements by selector
             * @param {string} selector
             * @returns {Object}
             */
            function findElements (selector) {

                return angular.element(element[0].querySelectorAll(selector))
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

                if (newValue.title === oldValue.title && newValue.playlist.length === oldValue.playlist.length) {
                    return;
                }

                if (!scope.vm.featured) {
                    scope.vm.heading = scope.vm.feed.title;
                }

                totalItems = scope.vm.feed.playlist.length;

                element.toggleClass('jw-card-slider-flag-loading', scope.vm.feed.loading);

                resizeHandler(true);
            }

            /**
             * Handle resize event
             */
            function resizeHandler (forceRender) {

                var newItemsVisible = angular.isNumber(scope.vm.cols) ? scope.vm.cols : utils.getValueForScreenSize(scope.vm.cols, 1),
                    needsRender     = newItemsVisible !== itemsVisible;

                itemsVisible   = newItemsVisible;
                itemsMargin    = newItemsVisible + 1;
                sliderCanSlide = totalItems > itemsVisible;

                sliderList.attr('class', 'jw-card-slider-list slides-' + itemsVisible);

                if (!sliderCanSlide) {
                    index          = 0;
                    sliderHasMoved = false;
                }

                findElements('.jw-card-slider-button').toggleClass('ng-hide', !sliderCanSlide);

                if (forceRender || needsRender) {
                    renderSlides();

                    if (false === sliderHasMoved) {
                        moveSlider(0, false);
                    }
                }
            }

            /**
             * Render dummy slides
             */
            function renderDummySlides () {

                var holder = angular.element('<div></div>');

                for (var i = 0; i < 5; i++) {
                    holder.append(angular.element(dummySlideTemplate));
                }

                sliderList
                    .html('')
                    .append(holder.children());
            }

            /**
             * Render slides
             */
            function renderSlides () {

                var holder     = angular.element('<div></div>'),
                    slides     = Array.prototype.slice.call(findElement('.jw-card-slider-list').children()),
                    current    = index,
                    startIndex = sliderHasMoved ? itemsMargin : 0,
                    totalCols  = itemsVisible + itemsMargin,
                    item, slide;

                if (sliderHasMoved) {
                    current -= itemsMargin;
                    totalCols += itemsMargin;
                }

                if (scope.vm.feed.loading) {
                    return renderDummySlides();
                }

                if (current < 0) {
                    current += totalItems;
                }

                for (var n = 0; n < totalCols; n++) {

                    if (current > totalItems - 1) {
                        if (!sliderCanSlide) {
                            break;
                        }

                        current -= totalItems;
                    }

                    item = scope.vm.feed.playlist[current];

                    // find existing slide
                    // test parentNode when an item is rendered twice
                    slide = slides.find(function (slide) {
                        return slide.parentNode !== holder[0] && slide.getAttribute('key') === item.$key;
                    });

                    if (!slide) {
                        slide = compileSlide(item);
                    }
                    else {
                        slide = angular.element(slide);
                    }

                    slide.removeClass('first last');
                    slide.toggleClass('is-visible', n >= startIndex && n < startIndex + itemsVisible);

                    if (current === 0) {
                        slide.addClass('first');
                    }

                    if (current === totalItems - 1) {
                        slide.addClass('last');
                    }

                    holder
                        .append(slide);

                    current++;
                }

                findElements('.jw-card-slider-slide')
                    .forEach(function (slide) {
                        var childScope = angular.element(slide).scope();
                        if (scope !== childScope) {
                            angular.element(slide).scope().$destroy();
                        }
                    });

                sliderList
                    .html('')
                    .append(holder.children());

                updateIndicator();
                findElement('.jw-card-slider-button-flag-left').toggleClass('is-disabled', !sliderHasMoved);
            }

            /**
             * Update the slider indicator
             */
            function updateIndicator () {

                var indicator = findElement('.jw-card-slider-indicator'),
                    children  = indicator.children();

                if (!scope.vm.featured) {
                    return;
                }

                // re-render dots if length mismatches
                if (children.length !== totalItems) {

                    indicator.html('');

                    for (var i = 0; i < totalItems; i++) {
                        indicator.append(angular.element('<div class="jw-card-slider-indicator-dot"></div>'));
                    }
                }

                // update active dot
                indicator
                    .children()
                    .removeClass('is-active')
                    .eq(index)
                    .addClass('is-active');
            }

            /**
             * Set visible classNames to slides
             * @param {number} offset
             */
            function updateVisibleSlides (offset) {

                var from = sliderHasMoved ? itemsMargin : 0,
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

                if (sliding || !sliderHasMoved) {
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

                    sliderHasMoved = true;

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

                if (sliderHasMoved) {
                    offset -= itemsMargin / itemsVisible * 100;
                }

                animation = window.TweenLite
                    .to(listElement, animate ? 0.3 : 0, {
                        x: offset + '%', z: 0.01, onComplete: onSlideComplete
                    });

                function onSlideComplete () {

                    sliding = false;

                    setTimeout(function () {
                        callback && callback();
                    }, 1);
                }
            }

            /**
             * Handle touchstart event
             * @param {Event} event
             */
            function onTouchStart (event) {

                var coords         = getCoords(event),
                    touchContainer = findElement('.jw-card-slider-align')[0];

                touchContainer.addEventListener('touchmove', onTouchMove);
                touchContainer.addEventListener('touchend', onTouchEnd);
                touchContainer.addEventListener('touchcancel', onTouchCancel);

                startCoords = coords;
                element.addClass('is-sliding');

                if (ionic.Platform.isAndroid() && ionic.Platform.version() < 5) {
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
                if (!sliderHasMoved && distanceX < 0) {
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

                if (distance < -50 && sliderHasMoved) {
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
