import { describe, it, expect } from "vitest";
import {
  parseVariables,
  hasVariables,
  substituteVariables,
  escapeHtml,
} from "./variables";

describe("parseVariables", () => {
  it("parses a simple variable with no default", () => {
    const vars = parseVariables(["docker exec -it {{container}} bash"]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("container");
    expect(vars[0].defaultValue).toBe("");
    expect(vars[0].options).toEqual([]);
  });

  it("parses a variable with default value", () => {
    const vars = parseVariables(["docker logs --tail {{lines=100}} app"]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("lines");
    expect(vars[0].defaultValue).toBe("100");
  });

  it("parses a variable with options", () => {
    const vars = parseVariables([
      "docker run --restart {{policy|no,always,unless-stopped}} app",
    ]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("policy");
    expect(vars[0].options).toEqual(["no", "always", "unless-stopped"]);
    expect(vars[0].defaultValue).toBe("");
  });

  it("parses a variable with default and options", () => {
    const vars = parseVariables([
      "docker run --restart {{policy=always|no,always,unless-stopped}} app",
    ]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("policy");
    expect(vars[0].defaultValue).toBe("always");
    expect(vars[0].options).toEqual(["no", "always", "unless-stopped"]);
  });

  it("deduplicates by name, first occurrence wins", () => {
    const vars = parseVariables([
      "curl {{host=localhost}}:{{port}} && curl {{host}}:{{port=8080}}",
    ]);
    expect(vars).toHaveLength(2);
    expect(vars[0].name).toBe("host");
    expect(vars[0].defaultValue).toBe("localhost");
    expect(vars[1].name).toBe("port");
    expect(vars[1].defaultValue).toBe("");
  });

  it("skips Go template expressions with dot prefix", () => {
    const vars = parseVariables([
      'docker ps --format "table {{.Names}}\\t{{.Status}}"',
    ]);
    expect(vars).toHaveLength(0);
  });

  it("skips escaped variables", () => {
    const vars = parseVariables(["echo \\{{literal}} and {{real}}"]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("real");
  });

  it("parses variables across multiple commands", () => {
    const vars = parseVariables([
      "docker pull {{image}}",
      "docker run -d --name {{name}} {{image}}",
    ]);
    expect(vars).toHaveLength(2);
    expect(vars[0].name).toBe("image");
    expect(vars[1].name).toBe("name");
  });

  it("handles mixed Go templates and variables", () => {
    const vars = parseVariables([
      'docker logs --tail {{lines=50}} $(docker ps -q --filter "name={{.Names}}")',
    ]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("lines");
  });

  it("returns empty array for no variables", () => {
    expect(parseVariables(["docker ps"])).toEqual([]);
    expect(parseVariables([])).toEqual([]);
  });

  it("handles variable names with underscores", () => {
    const vars = parseVariables(["docker run {{my_container_name}}"]);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe("my_container_name");
  });

  it("handles multiple variables on one line", () => {
    const vars = parseVariables([
      "docker run -p {{host_port}}:{{container_port}} {{image}}",
    ]);
    expect(vars).toHaveLength(3);
    expect(vars.map((v) => v.name)).toEqual([
      "host_port",
      "container_port",
      "image",
    ]);
  });

  it("trims whitespace from option values", () => {
    const vars = parseVariables(["{{env| dev , staging , prod }}"]);
    expect(vars[0].options).toEqual(["dev", "staging", "prod"]);
  });

  it("preserves fullMatch string", () => {
    const vars = parseVariables(["{{name=default|a,b}}"]);
    expect(vars[0].fullMatch).toBe("{{name=default|a,b}}");
  });
});

describe("hasVariables", () => {
  it("returns true for commands with variables", () => {
    expect(hasVariables(["docker exec -it {{container}} bash"])).toBe(true);
  });

  it("returns false for plain commands", () => {
    expect(hasVariables(["docker ps"])).toBe(false);
    expect(hasVariables([])).toBe(false);
  });

  it("returns false for Go template expressions", () => {
    expect(
      hasVariables([
        'docker ps --format "table {{.Names}}\\t{{.Status}}"',
      ]),
    ).toBe(false);
  });

  it("returns false for escaped variables", () => {
    expect(hasVariables(["echo \\{{literal}}"])).toBe(false);
  });

  it("returns true when mixed with Go templates", () => {
    expect(
      hasVariables(["docker logs --tail {{lines}} {{.Names}}"]),
    ).toBe(true);
  });
});

describe("substituteVariables", () => {
  it("substitutes a simple variable", () => {
    const result = substituteVariables(
      ["docker exec -it {{container}} bash"],
      { container: "my-app" },
    );
    expect(result).toEqual(["docker exec -it my-app bash"]);
  });

  it("substitutes multiple occurrences of the same variable", () => {
    const result = substituteVariables(
      ["echo {{host}} && ping {{host}}"],
      { host: "localhost" },
    );
    expect(result).toEqual(["echo localhost && ping localhost"]);
  });

  it("falls back to default value when no value provided", () => {
    const result = substituteVariables(
      ["docker logs --tail {{lines=100}} app"],
      {},
    );
    expect(result).toEqual(["docker logs --tail 100 app"]);
  });

  it("uses provided value over default", () => {
    const result = substituteVariables(
      ["docker logs --tail {{lines=100}} app"],
      { lines: "50" },
    );
    expect(result).toEqual(["docker logs --tail 50 app"]);
  });

  it("replaces with empty string when no value and no default", () => {
    const result = substituteVariables(["docker exec {{container}}"], {});
    expect(result).toEqual(["docker exec "]);
  });

  it("unescapes \\{{ to {{", () => {
    const result = substituteVariables(
      ["echo \\{{literal}} and {{name}}"],
      { name: "test" },
    );
    expect(result).toEqual(["echo {{literal}} and test"]);
  });

  it("leaves Go template {{.Field}} untouched", () => {
    const result = substituteVariables(
      ['docker ps --format "{{.Names}}"'],
      {},
    );
    expect(result).toEqual(['docker ps --format "{{.Names}}"']);
  });

  it("handles variables with options", () => {
    const result = substituteVariables(
      ["docker run --restart {{policy|no,always}} app"],
      { policy: "always" },
    );
    expect(result).toEqual(["docker run --restart always app"]);
  });

  it("substitutes across multiple commands", () => {
    const result = substituteVariables(
      ["docker pull {{image}}", "docker run {{image}}"],
      { image: "nginx:latest" },
    );
    expect(result).toEqual([
      "docker pull nginx:latest",
      "docker run nginx:latest",
    ]);
  });

  it("handles empty value for variable with options (uses empty)", () => {
    const result = substituteVariables(
      ["docker run --restart {{policy=always|no,always}} app"],
      { policy: "" },
    );
    expect(result).toEqual(["docker run --restart always app"]);
  });
});

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("does not escape curly braces", () => {
    expect(escapeHtml("{{name}}")).toBe("{{name}}");
  });
});
