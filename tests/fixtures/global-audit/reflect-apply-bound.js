const applyDefine = Reflect.apply.bind(Reflect, Object.defineProperty, Object,
  [window, "rogueReflectApplyBound", { value: true }]);
applyDefine();
