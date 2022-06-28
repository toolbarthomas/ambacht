# Ambacht Element

A framework independent component library based on [Lit Element](https://lit.dev/).

Ambacht Element is built on top of Lit Element for creating Web Components for your application.
It should also work for libraries that support the usage of Web Components.

The processed Ambacht components can be implemented seperately and expects that dependencies are not bundled with the actual component. Instead it directly uses standard [ESM imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) to include the dependencies for your component.

This means that you don't need to include any dependencies to your package manager (NPM/Yarn), but it is still possible if you want to serve the dependencies from the same location as the created components. Keep in mind that you need to implement a resolver if you want to serve local dependencies; since modules cannot resolve from an absolute path.

# Structure

An Ambacht element is created like a regular Lit Element. The actual styles, HTML and JS logic is defined within a single file. The workflow supports the usage of external stylesheets so you can use preprocessors like Node Sass or PostCSS. The generated stylesheets needs to be converted to a JS file so we can import it as module within the constructed Ambacht Element.

> Note: [Harbor](https://www.npmjs.com/package/@toolbarthomas/harbor) supports the conversion of stylesheets as module exports. This workflow can process the required assets for your Ambacht Component. More information about implementing **Ambacht** with the **Harbor** workflow can be found within the [Ambacht: README](https://github.com/toolbarthomas/harbor/blob/develop/README.md) and [Ambacht: Exporting assets as JS module for Web Components](https://github.com/toolbarthomas/harbor/blob/develop/TIPS.md#5-exporting-assets-as-js-module-for-web-components-)

# API

Ambacht Element is created on top of the existing Lit Element library the following methods and default properties have been included to speed up the
development process.

## Default properties

Ambacht Element includes some additional properties & dependencies for the initial component. These properties are required for the additional private & public methods.

##### this&#46;name

Defines a custom name for the constructed component, the constructor name will be used as fallback.

##### this&#46;preventEvent

A global flag that should block incomming Events within the constructed component. It should be used if you want to ensure Event stack from happening.

##### this&#46;spriteSource

Enables the usage of inline SVG Sprite elements if the `spriteSource` is defined for the initial component. A sprite element will be rendered if within the `_renderImage` method when this property is defined.

##### this&#46;disableFocusTrap

Prevents the creation of a new [Focus Trap](https://www.npmjs.com/package/focus-trap) instance for the defined component. The Focus Trap related helpers will do anything when this property is defined.

##### this&#46;throttleHandler

Stores the handler that was defined from `this._throttle` method to ensure it is only called once.

##### this&#46;throttle

Defines the throttle timeout in miliseconds for the constructed Ambacht component. It will default to 60 FPS in miliseconds.

##### this&#46;ignoredKeyCodes

Defines the keyCode values that should be ignored during a Keyboard Event. It should ignore the functional keyCodes like `shift` `return` `tab` etc.

##### this&#46;exitKeyCodes

Defines the keyCode values that should exit out of the current function scope from the component. This can be used to reset the component state like collapsing the element after the `escape` key is pressed.

##### this&#46;supportedImageExtensions

Defines the list of accepted image extensions that is used within the `_renderImage` `_testImageSource` & `_testImage` methods.

##### this&#46;root

Should match with the global scope of the JS context. This should be the Window object. The `Ambacht` global will be implemented within the given `root` context that is also used to mark the `currentElement`.

##### this&#46;context

The default component reference that should be assigned to the top parent element within the `render` method.

## Public Methods

##### firstUpdated()

Implements the core Ambacht dependencies like [Focus Trap](https://www.npmjs.com/package/focus-trap) for the defined component.

##### updated

Ensures the `currentElement` value is updated if the component has been (de)selected and that the `Ambacht` global is updated afterwards.

##### lockFocus

Enables the defined [Focus Trap](https://www.npmjs.com/package/focus-trap) within the current component.

##### unlockFocus

Disables the defined [Focus Trap](https://www.npmjs.com/package/focus-trap) within the current component.

##### log(`message: String` `type: Console.type`)

Alias function that uses the default Console object from the Browser.

##### subscribeGlobalEvent(`type: Event.type` `handler: Function`)

Subscribes a new Document Event listener to the globalEvents private property.

##### unsubscribeGlobalEvent(`type: Event.type` `handler: Function`)

Removes the subscribed Document Event listener from the globalEvents private property.

## Private Methods

These methods are Private and should only be used within the component instance. Private methods are prefixed with an underscore.

##### \_attributeNameForProperty(`name: string`)

Ensures the given string is formatted as snake cased value to ensure the compatibility for HTML attributes.

##### \_documentClickFunction(`event: PointerEvent`)

Implements a click Event handler for the current component. It will mark the component as `currentElement` within the Ambacht global.

##### \_documentKeyDownFunction(`event: KeyboardEvent`)

Implements a keydown handler for the created Ambacht component to remove the component as `currentElement`.

##### \_documentFocusFunction(`event: FocusEvent`)

Catches the focus Event within the component to mark it as `currentElement`.

##### \_filterDocumentEvent(`type: Event.type` `handler: Function`)

Check if the defined Function handler has been defined to the `documentEvents`
property.

##### \_handleEvent(`event: Event` `context: Element` `handler: Function|String`)

Helper function to initiate the passed handler. It can initiate the function directly or an Event will be dispatched within the given context.

##### \_handleCurrentElement(`event: Event`)

Marks the defined context as `currentElement` this function is also used within the `_global` Event functions like `_globalKeyDownFunction`.

##### \_update(`property: String` `handler: any`)

Wrapper function that will call `LitElement.requestUpdate` method within a Catch block. A function scope can be included instead to preform tasks before the requestUpdate is called.

```js
// Updates the title property and call the requestUpdate method directly.
this._update('title', 'Bar');
```

```js
// Will call the requestUpdate method for the title after the defined handler.
this._update('title', () => {
  ...
  this.title = 'Bar'
  ...
});
```

##### \_strip(`value: String`)

Ensure any whitespace characters are removed from the defined string.

```js
this._strip('Foo \n Bar'); // Expected value: FooBar
```

##### \_fn(`handler: Function|String`)

Implements support for Function handlers defined from the Window scope or Function Handlers within the component scope.

```js
this._fn('onRender'); // Calls the function from the global scope (this should be the Window Object)
```

```js
this._fn(this.OnRender); // Calls the function from the Component scope.
```

##### \_renderImage(`name: String` `classname: String`)

Renders the supported images defined within `AmbachtElement.supportedImageExtensions` as inline or external element. An inline SVG element will be used if `this.spriteSource` is defined for the initial component.

```js
// Will render the given image within an img tag.

this._renderImage('https://img.icons8.com/ios-glyphs/2x/search.png');
```

```js
// Will render the given image within an img tag since the
// spriteSource has not been defined for this component.

this._renderImage('example.svg', 'svg-icon'); // -> example.svg
```

```js
// Will render the given image as a SVG inline sprite since the
// spriteSource has been defined for this component.

this.spriteSource = 'sprite.svg';
this._renderImage('example', 'svg-icon'); // -> sprite.svg#example
```

##### \_testImageSource(`source: String`)

Test if the defined `source` parameter matches with the expected `supportedImageExtensions` values. This is internally used within the `_renderImage` method to defined the correct image element.

##### \_testImage(`initial: Boolean` `context: String`)

Tests if the defined source is a valid image extension that exists within the defined `supportedImageExtensions` property. The defined path parameter will also be escaped to ensure no white space is present for the source parameter.

##### \_throttle(`handler: Function`)

Throttles the given Function handler to ensure it is only called once and respects the default refresh rate of the component. The actual delay can be adjusted by defined the `throttle` property to the component. By default it will throttle at 60 FPS.

##### \_isComponentContext(element: Element)

Checks if the given Element exists within the Shadow Dom and Regular Dom within the current Component.

##### \_context()

Should return the main context for the current component this will be the actual
Shadow Dom if there is no parent reference defined for the current component.
