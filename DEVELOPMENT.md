# Local Development

Guide for building, testing, and running Groovity from source.

## Prerequisites

| Tool  | Required version | Notes |
|-------|-----------------|-------|
| JDK   | **8** (1.8)     | Source and target level are set to 1.8 in the root POM. OpenJDK 8 is recommended. |
| Maven | **3.6+**        | Tested with 3.6.3. |

### Installing on Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y openjdk-8-jdk maven
```

Make sure Maven picks up JDK 8:

```bash
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
```

You can add the `export` to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) to make it permanent.

Verify:

```bash
mvn --version
# Java version should show 1.8.x
```

### macOS (Homebrew)

```bash
# Install a JDK 8 distribution (e.g. Temurin)
brew install --cask temurin@8
export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)

brew install maven
```

## Building

From the repository root:

```bash
mvn clean install
```

This compiles all ~20 modules, runs the Groovity test suites (via the
`groovity-maven-plugin`), and installs artifacts into your local
`~/.m2/repository`.

A successful build takes roughly 1-2 minutes.

### Skipping tests

```bash
mvn clean install -DskipTests
```

Note: the Groovity-specific tests are executed by the `groovity-maven-plugin`
(goals `test` / `package`), not by Surefire. `-DskipTests` skips the standard
Surefire/Failsafe tests; the Groovity plugin tests still run during the
`package` phase in modules that configure them (e.g. `groovity-integration-tests`,
`groovity-hello-world`, `groovity-data`, etc.). To skip everything and only
compile:

```bash
mvn clean install -DskipTests -Dgroovity.test.skip=true
```

## Running the tests

Tests run automatically as part of `mvn clean install`. To run tests for a
single module:

```bash
cd groovity-integration-tests
mvn verify
```

Test output appears inline in the Maven log. Look for lines like:

```
RUNNING /testEcho
RUNNING /testBasicAuth
...
TEST COVERAGE 100% TOTAL
```

A `BUILD SUCCESS` at the end confirms all tests passed.

## Project structure

| Module | Description |
|--------|-------------|
| `uri-parcel` | URI-based content abstraction (core, JSON, keys) |
| `http-auth` | HTTP authentication libraries (core, server, client, samples) |
| `groovity-core` | Compiler, runtime, and built-in tag library |
| `groovity-servlet` | Servlet 3.0 integration |
| `groovity-servlet-container` | Embedded Jetty container |
| `groovity-servlet-admin` | Admin REST API and web UI |
| `groovity-error-page` | Default error page handler |
| `groovity-maven-plugin` | Maven plugin for compile, test, run, and package |
| `groovity-jar-runner` | Executable JAR runner |
| `groovity-standalone` | All-in-one standalone executable |
| `groovity-hello-world` | Minimal example application |
| `groovity-sample-jar` | Sample JAR runner project |
| `groovity-sample-webapp` | Sample web application |
| `groovity-integration-tests` | Integration test suite |
| `groovity-events` | Client/server event framework over WebSockets |
| `groovity-crypto` | Cryptography utilities |
| `groovity-data` | Data abstraction library |
| `groovity-data-service` | Data service layer |
| `groovity-sql` | SQL library and `sqlPager` tag |
| `groovity-portal` | Portal application framework |
| `groovity-sample-portal` | Sample portal application |
| `groovity-elasticsearch` | Elasticsearch data loader |
| `groovity-websocket` | WebSocket abstraction and client tag |

## Running a Groovity application locally

### Using the Maven plugin (development mode)

The `groovity-maven-plugin` provides a `run` goal that starts an embedded Jetty
server with hot-reload. From any module that has the plugin configured (e.g.
`groovity-sample-jar`):

```bash
cd groovity-sample-jar
mvn groovity:run
```

This starts a web server on port **9880** by default and opens an interactive
shell. Groovity scripts are compiled on-the-fly; edits to `.grvt` files in
`src/main/groovity/` and `src/test/groovity/` are picked up automatically.

To run a specific script path instead of the interactive shell:

```bash
mvn groovity:run -Dpath=/testHello
```

### Using the standalone JAR

After building, the standalone uber-JAR is at:

```
groovity-standalone/target/groovity-standalone-<version>.jar
```

Run it with:

```bash
java -jar groovity-standalone/target/groovity-standalone-2.1.0-beta.2-SNAPSHOT.jar [port]
```

The default port is **9880**. Pass a port number as the first argument to
override.

## Data sources (`groovity-data`)

The `groovity-data` module provides pluggable persistence back-ends via source
scripts in `src/main/groovity/data/sources/`. A type selects its source with the
`source` key in its static `conf` map.

### Built-in sources

| Source     | Script              | Description                          |
|------------|---------------------|--------------------------------------|
| `memory`   | `sources/memory`    | In-process `ConcurrentHashMap`       |
| `file`     | `sources/file`      | Local filesystem (JSON/XML files)    |
| `http`     | `sources/http`      | Remote REST endpoint                 |
| `redis`    | `sources/redis`     | Redis server (Jedis client)          |

### Redis source configuration

Set `source: 'redis'` in the type's `conf` map and provide connection details
via the following keys:

| Key              | Default     | Description                              |
|------------------|-------------|------------------------------------------|
| `redis.host`     | `localhost` | Redis server hostname                    |
| `redis.port`     | `6379`      | Redis server port                        |
| `redis.password` | *(none)*    | Redis authentication password (optional) |
| `redis.db`       | `0`         | Redis database index                     |
| `redis.timeout`  | `2000`      | Connection timeout in milliseconds       |
| `redis.prefix`   | `groovity`  | Key namespace prefix                     |

Example type definition:

```groovy
public static conf = [
    source : 'redis',
    ttl : '30',
    refresh : '15',
    'redis.host' : 'redis.example.com',
    'redis.prefix' : 'myapp_widgets'
]

class Widget implements DataModel, Stored, HasName {
    String description
}

new Widget()
```

**Redis key layout** &mdash; each entity is stored as a Redis hash at
`{prefix}:{id}` with fields `data` (JSON) and `updateTime` (epoch ms). A sorted
set at `{prefix}:_idx` indexes IDs by update time to support efficient
`dateRange` / watch queries.

**Prerequisites** &mdash; a running Redis server reachable at the configured
host/port. The `groovity-data` module depends on Jedis 4.4.x (pulled in
automatically by Maven).

## Gotchas

- **JDK version matters.** The project targets Java 8. Building with JDK 11+
  may produce warnings or failures in some modules due to removed/relocated
  APIs. Stick with JDK 8 for a clean build.
- **Maven uses `JAVA_HOME`.** If you have multiple JDKs installed, make sure
  `JAVA_HOME` points to your JDK 8 installation before running Maven. Verify
  with `mvn --version`.
- **npm warnings during build.** The `groovity-servlet-admin` module runs `npm
  install` as part of its build. You may see npm audit warnings — these do not
  affect the build result.
- **No CI configuration.** The repository does not include CI pipeline
  definitions (GitHub Actions, Travis, etc.), so all validation is done locally.
- **Groovity tests are not Surefire tests.** The `.grvt` test scripts are
  executed by the `groovity-maven-plugin`, not by the standard Maven Surefire
  plugin. This means standard flags like `-Dtest=MyTest` do not apply; use
  `-Dpath=/testName` with `groovity:run` for targeted execution.
