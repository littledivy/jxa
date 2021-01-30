import { run, runJXACode } from "./mod.ts"
import { assertObjectMatch, assertStrictEquals, assertThrowsAsync } from "https://deno.land/std@0.85.0/testing/asserts.ts";

type Sign = "-" | "+";

const user = Deno.env.get("USER");

const getJXAErrorMessage = (message: string): string => `execution error: ${message} (-2700)`

Deno.test("#runJXACode system access", async () => {
    const result = await runJXACode<string>(
    `Application("System Events").currentUser().name();`,
    );
    assertStrictEquals(result, user);
});

Deno.test("#run system access", async () => {
  const result = await run<void>(
    () =>
      //@ts-ignore
      Application("System Events")
        .currentUser()
        .name(),
  );
  assertStrictEquals(result, user);
});

Deno.test("#run returns string", async () => {
    const result = await run<string>(() => `Hello there!`);
    assertStrictEquals(result, "Hello there!");
});

Deno.test("#run returns number", async () => {
  const result = await run<number>(() => 123.47);
  assertStrictEquals(result, 123.47);
});

Deno.test("#run returns object", async () => {
  const result = await run(() => {
    //@ts-ignore
    const properties = Application("System Events").currentUser().properties();
    const fields = ["name", "homeDirectory"];
    const resultObject: Record<string, string> = {};
    for (const field of fields) {
      resultObject[field] = properties[field];
    }
    return resultObject;
  });
  assertObjectMatch(result, {
    name: user,
    homeDirectory: `/Users/${user}`,
  });
});

Deno.test("#run returns nothing", async () => {
  const result = await run<void>(() => {
  });
  assertStrictEquals(result, undefined);
});

Deno.test("#run 1 argument", async () => {
  const result = await run<string, string>(
    (name) => `Hello ${name}!`,
    "Deno"
  );
  assertStrictEquals(result, "Hello Deno!");
});

Deno.test("#run 2 arguments", async () => {
    const result = await run<string, string, boolean>(
        (name, exclaim) => `Hello ${name}${exclaim ? "!" : "."}`,
        "Deno", false)
    assertStrictEquals(result, "Hello Deno.")
});

Deno.test("#run arithmetic", async () => {
    const result = await run<number, number, Sign>((num: number, sign: Sign) => {
        let multiplier: number;
        switch (sign) {
        case "-":
            multiplier = -1;
            break;
        case "+":
            multiplier = +1;
            break;
        default:
            throw TypeError("sign should be either '+' or '-'");
        }
        return num * multiplier
    }, 365, "-")
    assertStrictEquals(result, -365)
});

Deno.test("#run Error", async () => {
    await assertThrowsAsync(() => run<string, boolean>((error: boolean) => {
        if (error) throw Error("This is an error!")
        return "There is no error."
    }, true), Error, getJXAErrorMessage("Error: This is an error!"))
})

Deno.test("#run TypeError", async () => {
  await assertThrowsAsync(
    () => run<string>(() => {
        const num = 11
        // @ts-ignore
        return num.toUpperCase()
    }, true),
    Error,
    getJXAErrorMessage("TypeError: num.toUpperCase is not a function. (In 'num.toUpperCase()', 'num.toUpperCase' is undefined)")
  );
});