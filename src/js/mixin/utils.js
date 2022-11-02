import { $, $$, apply, css, noop, on, scrollParents, width, within } from 'uikit-util';

export function getMaxPathLength(el) {
    return Math.ceil(
        Math.max(
            0,
            ...$$('[stroke]', el).map((stroke) => {
                try {
                    return stroke.getTotalLength();
                } catch (e) {
                    return 0;
                }
            })
        )
    );
}

export function preventOverscroll(el) {
    if (CSS.supports('overscroll-behavior', 'contain')) {
        const elements = filterChildren(el, (child) => /auto|scroll/.test(css(child, 'overflow')));
        css(elements, 'overscrollBehavior', 'contain');
        return () => css(elements, 'overscrollBehavior', '');
    }

    let startClientY;

    const events = [
        on(
            el,
            'touchstart',
            ({ targetTouches }) => {
                if (targetTouches.length === 1) {
                    startClientY = targetTouches[0].clientY;
                }
            },
            { passive: true }
        ),

        on(
            el,
            'touchmove',
            (e) => {
                if (e.targetTouches.length !== 1) {
                    return;
                }

                let [scrollParent] = scrollParents(e.target, /auto|scroll/);
                if (!within(scrollParent, el)) {
                    scrollParent = el;
                }

                const clientY = e.targetTouches[0].clientY - startClientY;
                const { scrollTop, scrollHeight, clientHeight } = scrollParent;

                if (
                    clientHeight >= scrollHeight ||
                    (scrollTop === 0 && clientY > 0) ||
                    (scrollHeight - scrollTop <= clientHeight && clientY < 0)
                ) {
                    e.cancelable && e.preventDefault();
                }
            },
            { passive: false }
        ),
    ];

    return () => events.forEach((fn) => fn());
}

export function preventBackgroundScroll() {
    const { scrollingElement } = document;

    if (scrollingElement.style.overflowY === 'hidden') {
        return noop;
    }

    css(scrollingElement, {
        overflowY: 'hidden',
        touchAction: 'none',
        paddingRight: width(window) - scrollingElement.clientWidth,
    });
    return () => css(scrollingElement, { overflowY: '', touchAction: '', paddingRight: '' });
}

function filterChildren(el, fn) {
    const children = [];
    apply(el, (node) => {
        if (fn(node)) {
            children.push(node);
        }
    });
    return children;
}

export function isSameSiteAnchor(a) {
    return ['origin', 'pathname', 'search'].every((part) => a[part] === location[part]);
}

export function getTargetElement(el) {
    return document.getElementById(decodeURIComponent(el.hash).substring(1));
}

export function generateId(component, el = component.$el, postfix = '') {
    if (el.id) {
        return el.id;
    }

    let id = `${component.$options.id}-${component._uid}${postfix}`;

    if ($(`#${id}`)) {
        id = generateId(component, el, `${postfix}-2`);
    }

    return id;
}
