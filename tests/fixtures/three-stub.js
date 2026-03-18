/**
 * Minimal Three.js stub used only during automated testing.
 * Provides enough of the THREE API for the app to initialise without errors,
 * while keeping the stub as small as possible so tests remain fast and focused
 * on the DOM/interaction logic rather than 3D rendering.
 */
(function () {
  function noop() {}

  function makeVec3() {
    const v = {
      set: function () { return v; },
      multiplyScalar: function () { return v; },
    };
    return v;
  }

  function makeDisposable() {
    return { dispose: noop };
  }

  window.THREE = {
    Scene: function () {
      this.background = null;
      this.children = [];
      this.add = noop;
      this.remove = noop;
    },

    PerspectiveCamera: function () {
      this.position = makeVec3();
      this.aspect = 1;
      this.lookAt = noop;
      this.updateProjectionMatrix = noop;
    },

    WebGLRenderer: function () {
      this.setSize = noop;
      this.render = noop;
      this.setPixelRatio = noop;
    },

    AmbientLight: function () {},

    DirectionalLight: function () {
      this.position = makeVec3();
    },

    GridHelper: function () {
      this.position = { y: 0 };
      this.material = { opacity: 1, transparent: false };
    },

    BoxGeometry: function () { return makeDisposable(); },
    SphereGeometry: function () { return makeDisposable(); },
    CylinderGeometry: function () { return makeDisposable(); },
    ConeGeometry: function () { return makeDisposable(); },

    MeshPhongMaterial: function () { return makeDisposable(); },
    LineBasicMaterial: function () {},

    Mesh: function (geo, mat) {
      this.geometry = geo || makeDisposable();
      this.material = mat || makeDisposable();
      this.rotation = { x: 0, y: 0 };
      this.add = noop;
    },

    EdgesGeometry: function () {},
    LineSegments: function () {},
  };
}());
