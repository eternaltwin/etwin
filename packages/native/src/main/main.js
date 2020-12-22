import addon from "../../native";

const out = addon.hello(async (arg) => {
  console.log("arg");
  await delay(1000);
  console.log(arg);
  return arg * 2;
});

console.log(out);

async function delay(t) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, t);
  });
}

const UUID4_GENERATOR = new addon.Uuid4Generator();
console.log(UUID4_GENERATOR.next());
