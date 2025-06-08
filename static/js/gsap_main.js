// static/js/gsap_main.js
// Gestion global de GSAP y ScrollSmoother

(function(window){
    const plugins = [
        ScrollTrigger,
        ScrollSmoother,
        MotionPathPlugin,
        MotionPathHelper,
        MorphSVGPlugin,
        Observer,
        PixiPlugin,
        ScrambleTextPlugin,
        ScrollToPlugin,
        SplitText,
        TextPlugin,
        CustomEase,
        CustomBounce,
        Flip,
        Physics2DPlugin,
        DrawSVGPlugin
    ];

    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(...plugins);
    }

    let smootherInstance;

    function initSmoother(){
        if(!smootherInstance){
            smootherInstance = ScrollSmoother.create({
                wrapper: '#gsap-smoother-wrapper',
                content: '#gsap-smoother-content',
                smooth: 1,
                effects: true
            });
        }
        return smootherInstance;
    }

    const animations = [];

    function registerAnimation(fn){
        if(typeof fn === 'function'){
            animations.push(fn);
            if(document.readyState === 'complete'){
                fn(gsap, initSmoother());
            }
        }
    }

    function runAnimations(){
        const sm = initSmoother();
        animations.forEach(fn => {
            try{ fn(gsap, sm); }catch(e){ console.error(e); }
        });
    }

    window.gsapApp = {
        gsap,
        registerAnimation,
        getSmoother: initSmoother,
        refresh: () => ScrollTrigger.refresh()
    };

    window.addEventListener('load', runAnimations);
})(window);
