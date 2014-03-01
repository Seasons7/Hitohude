#include "AppDelegate.h"

#include "cocos2d.h"
#include "SimpleAudioEngine.h"
#include "ScriptingCore.h"
#include "jsb_cocos2dx_auto.hpp"
#include "jsb_cocos2dx_extension_auto.hpp"
#include "jsb_cocos2dx_builder_auto.hpp"
#include "cocos2d_specifics.hpp"
#include "extension/jsb_cocos2dx_extension_manual.h"

#include "chipmunk/js_bindings_chipmunk_registration.h"
#include "cocosbuilder/js_bindings_ccbreader.h"

#include "jsb_opengl_registration.h"
#include "localstorage/js_bindings_system_registration.h"

USING_NS_CC;
using namespace CocosDenshion;

AppDelegate::AppDelegate()
{
}

AppDelegate::~AppDelegate()
{
    ScriptEngineManager::destroyInstance();
}

void AppDelegate::setupMultiResolution( void ) {
    
    Director *pDirector = Director::getInstance();
    
    std::vector<std::string> searchPaths;
    std::vector<std::string> resDirOrders;
    
    Size screenSize = CCEGLView::getInstance()->getFrameSize();
    Size designSize = Size(320, 480);
    Size resourceSize = Size(320, 480);
    
    Platform platform = CCApplication::getInstance()->getTargetPlatform();

    // iPhone, iPad上で実行時
    resDirOrders.push_back("res/sound");
    if (platform == Platform::OS_IPHONE || platform == Platform::OS_IPAD)
    {
        CCFileUtils::getInstance()->setSearchPaths(searchPaths);
        
        if (screenSize.height > 480)
        {
            if (screenSize.height > 960) {
                // iphone 5,5s, ipod touch 5th gen
                resourceSize = Size(640, 1136);
                designSize = Size(320, 1136/2);
            } else {
                resourceSize = Size(640, 960);
            }
            resDirOrders.push_back("res/resources-iphonehd");
        }
        else
        {
            resDirOrders.push_back("resources-iphone");
        }

        CCFileUtils::getInstance()->setSearchResolutionsOrder(resDirOrders);
    }
    
    pDirector->setContentScaleFactor(resourceSize.width/designSize.width);
    
    CCEGLView::getInstance()->setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy::SHOW_ALL);
}

bool AppDelegate::applicationDidFinishLaunching()
{
    // initialize director
    Director *director = Director::getInstance();
    director->setOpenGLView(EGLView::getInstance());
    
    // turn on display FPS
    director->setDisplayStats(false);
    
    // set FPS. the default value is 1.0/60 if you don't call this
    director->setAnimationInterval(1.0 / 60);
    
    this->setupMultiResolution();
    
    ScriptingCore* sc = ScriptingCore::getInstance();
    sc->addRegisterCallback(register_all_cocos2dx);
    sc->addRegisterCallback(register_all_cocos2dx_extension);
    sc->addRegisterCallback(register_cocos2dx_js_extensions);
    sc->addRegisterCallback(register_all_cocos2dx_extension_manual);
    sc->addRegisterCallback(jsb_register_chipmunk);
    sc->addRegisterCallback(JSB_register_opengl);
    sc->addRegisterCallback(jsb_register_system);
    
    //+add
    sc->addRegisterCallback(register_all_cocos2dx_builder);
    sc->addRegisterCallback(register_CCBuilderReader);
    
    sc->start();
    
    sc->enableDebugger();
    
    ScriptEngineProtocol *engine = ScriptingCore::getInstance();
    ScriptEngineManager::getInstance()->setScriptEngine(engine);
    ScriptingCore::getInstance()->runScript("cocos2d-jsb.js");
       
    return true;
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::applicationDidEnterBackground()
{
    Director::getInstance()->stopAnimation();
    SimpleAudioEngine::getInstance()->pauseBackgroundMusic();
    SimpleAudioEngine::getInstance()->pauseAllEffects();
}

// this function will be called when the app is active again
void AppDelegate::applicationWillEnterForeground()
{
    Director::getInstance()->startAnimation();
    SimpleAudioEngine::getInstance()->resumeBackgroundMusic();
    SimpleAudioEngine::getInstance()->resumeAllEffects();
}
