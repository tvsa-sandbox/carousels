class Utils {
    static existFields(data, keys, requestDefault = "") {
        const KEYS = keys.split(".");
        let objectTest = data;
        const VALIDATE = () => (
            KEYS.every((key) => {
                const REQUEST = (typeof objectTest[key] !== "undefined");
                objectTest = objectTest[key];
                return REQUEST;
            })
        );
        return VALIDATE() ? objectTest : requestDefault;
    }

    static get isMobile() { /* ads */
        const DEVICE = (typeof navigator !== "undefined")
            ? navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)
            : "desktop";
        const WIDTH_SCREEN = (typeof window !== "undefined")
            ? window.innerWidth
            : "1024";
        let request = "desktop";

        if (DEVICE != null) {
            if (WIDTH_SCREEN <= 768) {
                request = "phone";
            } else if (WIDTH_SCREEN > 768 && WIDTH_SCREEN <= 1024) {
                request = "tablet";
            }
        }
        return request;
    }
}


/**
 * Logic for CircularCarousel.
 *
 * @category UI Carousel.
 * @package Carousel.
 * @author Jorge Mendez Ortega <jorge.mendez.ortega@gmail.com>
*/
class CircularCarousel {
    /**
     * Begin build Config.
     *
     * @param {object} config Initial config for Carousel.
     */
    constructor(config) {
        this.settings = config;
        const {
            arrowNext, arrowPrevious,
            carouselTrack,
        } = this.config;

        this.getElementDom(arrowNext, "arrowNext");
        this.getElementDom(arrowPrevious, "arrowPrevious");
        const $CONTAINER = this.getElementDom(carouselTrack, "visualBox");

        if ($CONTAINER) {
            const CHILDREN = $CONTAINER.children;
            const ITEMS = CHILDREN.length;
            const FIRS_CHILD = CHILDREN[0];
            const GET_STYLES = window.getComputedStyle(FIRS_CHILD);
            const ITEM_SIZE = FIRS_CHILD.offsetWidth + parseInt(GET_STYLES.marginRight, 10);
            const VISUAL_BOX_SIZE = $CONTAINER.offsetWidth;
            const IS_ACTIVE = (ITEM_SIZE * ITEMS) > VISUAL_BOX_SIZE;
            if (IS_ACTIVE) {
                this.config.items = ITEMS;
                this.config.itemSize = ITEM_SIZE;
                this.config.visualBoxSize = VISUAL_BOX_SIZE;
                this.config.success = IS_ACTIVE;
                this.buildCarousel();
            } else {
                $CONTAINER.dataset.active = 0;
                this.hiddenArrow();
                this.activeItem();
            }
        }
    }

    /**
     * Shows the item that is active.
     *
     * @return {void}
     */
    activeItem() {
        const { visualBox: $CONTAINER, pin } = this.config;
        if (pin !== null) {
            const ITEMS = [...$CONTAINER.children];
            ITEMS.forEach((item, index) => {
                item.addEventListener("click", () => {
                    const { enabled, disabled } = pin;
                    const ITEM_ACTIVE = $CONTAINER.dataset.active;
                    const OLD_ITEM = ITEMS[ITEM_ACTIVE];
                    const NEW_ITEM = ITEMS[index];
                    const INDEX_OLD_ITEM = Utils.existFields(OLD_ITEM, "dataset.clone", null);
                    const INDEX_NEW_ITEM = Utils.existFields(NEW_ITEM, "dataset.clone", null);
                    const CLONE_NEW_ITEM = ITEMS[INDEX_NEW_ITEM] || null;
                    const CLONE_OLD_ITEM = ITEMS[INDEX_OLD_ITEM] || null;

                    OLD_ITEM.classList.remove(enabled);
                    OLD_ITEM.classList.add(disabled);
                    if (CLONE_OLD_ITEM) {
                        CLONE_OLD_ITEM.classList.remove(enabled);
                        CLONE_OLD_ITEM.classList.add(disabled);
                    }

                    NEW_ITEM.classList.add(enabled);
                    NEW_ITEM.classList.remove(disabled);
                    if (CLONE_NEW_ITEM) {
                        CLONE_NEW_ITEM.classList.add(enabled);
                        CLONE_NEW_ITEM.classList.remove(disabled);
                    }
                    $CONTAINER.dataset.active = index;
                });
            });
        }
    }

    /**
     * Enabled action for arrows.
     *
     * @param  {Boolean} isNext (Optional)Indicate the type of action for the arrow.
     * @return {void}
     */
    actionArrow(isNext = false) {
        if (this.config.isActive) {
            const {
                itemSize, moveItems,
                pixels, endPoint,
            } = this.config;
            const MOVE_TO = (itemSize * moveItems);
            const PIXELS = (isNext) ? (pixels + MOVE_TO) : (pixels - MOVE_TO);
            let movePixels = PIXELS;
            if (PIXELS > endPoint) {
                movePixels = endPoint;
            } else if (PIXELS < 0) {
                movePixels = 0;
            }
            this.config.pixels = movePixels;
            this.config.isActive = false;
            this.translateCarousel(true);
        }
    }

    /**
     * Build the config for CircularCarousel.
     *
     * @return {void}
     */
    buildCarousel() {
        const {
            arrowNext, arrowPrevious, itemSize,
            visualBoxSize, items, moveItems,
        } = this.config;
        const CLONE = Math.floor(visualBoxSize / itemSize);
        const IS_CLONE = this.cloneItem(CLONE);
        if (IS_CLONE) {
            const PIXELS = itemSize * CLONE;
            this.config.startPoint = PIXELS;
            this.config.endPoint = (items * itemSize) + PIXELS;
            this.config.pixels = itemSize * CLONE;
            this.config.moveItems = (moveItems === 0 || moveItems > CLONE) ? CLONE : moveItems;
            this.config.isActive = true;
            this.translateCarousel();
            arrowNext.addEventListener("click", () => this.actionArrow(true));
            arrowPrevious.addEventListener("click", () => this.actionArrow());
            this.activeItem();
            this.buildSwipeCarousel();
        }
    }

    /**
     * Enabled swipe in the carousel`s.
     *
     * @return {void}.
     */
    buildSwipeCarousel() {
        const DEVICE = Utils.isMobile;

        if (DEVICE !== "desktop") {
            const { visualBox, swipe } = this.config;
            const PHONE = navigator.userAgent.toLowerCase();
            const IS_ANDROID = PHONE.indexOf("android");
            const TRACK = visualBox.parentNode || null;
            if (TRACK) {
                TRACK.addEventListener("touchstart", (action) => {
                    const TOUCH = Utils.existFields(action, "touches.0", null);
                    if (TOUCH) {
                        swipe.startX = TOUCH.screenX;
                        swipe.startY = TOUCH.screenY;
                    }
                }, false);

                TRACK.addEventListener("touchmove", (action) => {
                    const TOUCH = Utils.existFields(action, "touches.0", null);
                    if (TOUCH) {
                        swipe.endX = TOUCH.screenX;
                        swipe.endY = TOUCH.screenY;
                        swipe.direction = this.getDirecctionSlide();
                        if (IS_ANDROID < 0) {
                            document.querySelector("body").style.overflow = "hidden";
                        }
                    }
                }, false);

                TRACK.addEventListener("touchend", () => {
                    if (swipe.direction !== "") {
                        if (swipe.direction === "left" || swipe.direction === "right") {
                            const IS_LEFT = (swipe.direction === "left");
                            this.actionArrow(IS_LEFT);
                        }
                        if (IS_ANDROID < 0) {
                            document.querySelector("body").style.overflow = "";
                        }
                        swipe.direction = "";
                    }
                }, false);
            } else {
                /* eslint-disable */
                console.groupCollapsed("%c 🚫 [CircularCarousel => Error implement the touch events]", "color:#ff3333;");
                console.error(Error);
                console.groupEnd();
                /* eslint-enable */
            }
        } else {
            this.hiddenArrow(true);
        }
    }

    /**
     * Initial clone items for carousel.
     *
     * @param  {Integer} limit Number of items for clone.
     * @return {Boolean}.
     */
    cloneItem(limit) {
        let response = false;
        try {
            const { visualBox: $CONTAINER, items } = this.config;
            const CHILDREN = [...$CONTAINER.children];
            const ITEMS = Object.entries({
                bottom: CHILDREN.slice(0, limit),
                top: CHILDREN.slice(-limit),
            });

            ITEMS.forEach((item) => {
                const KEY = item[0];
                const CLONE = (KEY === "bottom") ? item[1] : item[1].reverse();
                CLONE.forEach((element, index) => {
                    const DOM = element.cloneNode(true);
                    let indexClone = index;
                    if (KEY === "bottom") {
                        indexClone = (items + index) + limit;
                        $CONTAINER.appendChild(DOM);
                    } else $CONTAINER.insertBefore(DOM, $CONTAINER.firstChild);
                    /* eslint-disable */
                    element.dataset.clone = indexClone;
                    /* eslint-enable */
                });
            });
            $CONTAINER.dataset.active = limit;
            response = true;
        } catch (Error) {
            /* eslint-disable */
            console.groupCollapsed("%c 🚫 [CircularCarousel => Error cloning components]", "color:#ff3333;");
            console.error(Error);
            console.groupEnd();
            /* eslint-enable */
        }
        return response;
    }

    /**
     * Get an element of the DOM.
     *
     * @param  {stting} selector (Option) querySelector.
     * @return {Object}
     */
    getElementDom(selector = "", key) {
        let element = null;
        const DOCUMENT = document || null;
        if (DOCUMENT && selector) {
            element = document.querySelector(selector);
            this.config[key] = element;
        }
        return element;
    }

    /**
     * Get direction for action swipe.
     *
     * @return {String}
     */
    getDirecctionSlide() {
        const { swipe } = this.config;

        const HZR_X1 = ((swipe.endX - swipe.min_x) > swipe.startX);
        const HZR_X2 = ((swipe.endX + swipe.min_x) < swipe.startX);
        const HZR_Y1 = (swipe.endY < (swipe.startY + swipe.max_y));
        const HZR_Y2 = (swipe.startY > (swipe.endY - swipe.max_y));

        const VERT_Y1 = ((swipe.endY - swipe.min_y) > swipe.startY);
        const VERT_Y2 = ((swipe.endY + swipe.min_y) < swipe.startY);
        const VERT_X1 = (swipe.endX < (swipe.startX + swipe.max_x));
        const VERT_X2 = (swipe.startX > (swipe.endX - swipe.max_x));

        const IS_HORIZONTAL = ((HZR_X1 || HZR_X2) && (HZR_Y1 && HZR_Y2));
        const IS_VERTICAL = ((VERT_Y1 || VERT_Y2) && (VERT_X1 && VERT_X2));

        let direction = "";

        if (IS_HORIZONTAL) {
            direction = (swipe.endX > swipe.startX) ? "right" : "left";
        } else if (IS_VERTICAL) {
            direction = (swipe.endY > swipe.startY) ? "bottom" : "top";
        }
        return direction;
    }

    /**
     * Arrow hidden when the carousel is not valid
     * or displayed on a smart phone.
     *
     * @return {Void}
     */
    hiddenArrow(show = false) {
        const {
            arrowNext: NEXT,
            arrowPrevious: PREVIOUS,
            display,
        } = this.config;
        const DISPLAY = (!show) ? "none" : display;
        NEXT.parentNode.style.display = DISPLAY;
        PREVIOUS.parentNode.style.display = DISPLAY;
    }

    /**
     * Create anitamiton for the carousel.
     *
     * @param  {Boolean} (Optional)Enable animation for the carousel.
     * @return {void}
     */
    translateCarousel(live = false) {
        const {
            visualBox: $CONTAINER,
            pixels, endPoint, startPoint, time,
        } = this.config;
        const TRANSFORM = `transform: translate3d(-${pixels}px, 0px, 0px);`;
        const TRANSITION = `transition:transform ${time}ms ease 0s`;
        const STYLE = TRANSFORM + ((live) ? TRANSITION : "");
        $CONTAINER.setAttribute("style", STYLE);
        setTimeout(() => {
            if (endPoint === pixels || pixels === 0) {
                this.config.pixels = (pixels === 0) ? (endPoint - startPoint) : startPoint;
                this.translateCarousel();
            }
            this.config.isActive = true;
        }, time);
    }

    /* =========================================== */
    /*       Eventos Setters and Getters           */
    /* =========================================== */

    /**
     * Begin the config.
     *
     * @param  {Object} config Params for the config.
     * @return {Void}
     */
    set settings(config) {
        const DEFAULT = {
            arrowNext: "ArrowNext",
            arrowPrevious: "ArrowPrevious",
            visualBox: "CarouselTrack",
            display: "flex",
            moveItems: 0,
            time: 200,
            pin: null,
            swipe: {
                direction: "",
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0,
                min_x: 20,
                max_x: 20,
                min_y: 80,
                max_y: 80,
            },
        };
        this.config = Object.assign(DEFAULT, config);
    }
}

/* ======================= */

class Auxiliar {
    static set init(config) {
        const CONFIG = JSON.stringify(config);
        const NEW_CONFIG = JSON.parse(CONFIG);
        const TEST = new CircularCarousel(NEW_CONFIG);
    }
}
