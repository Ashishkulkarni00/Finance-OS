# ADR-0013 — Consequences of Spring Boot 4

**Status:** Accepted · **Date:** 2026-09-09 · **Milestone:** 1

## Context

The project was initialised on **Spring Boot 4.1.1** (Spring Framework 7.0.9,
Hibernate 7.4.5, Java 21). The instruction was to use the versions actually present
rather than upgrade or downgrade for convenience.

Boot 4 is a major release with breaking changes that are not obvious from a
`pom.xml`, and three of them cost real debugging time during this milestone. They are
recorded here so the next person does not repeat them.

## The four that matter

### 1. Jackson 3 — package renamed

Boot 4 ships **Jackson 3.1.5** under `tools.jackson.*`, not `com.fasterxml.jackson.*`.
Classes were renamed too:

| Jackson 2 | Jackson 3 |
|---|---|
| `com.fasterxml.jackson.databind.JsonSerializer` | `tools.jackson.databind.ValueSerializer` |
| `SerializerProvider` | `tools.jackson.databind.SerializationContext` |
| `com.fasterxml.jackson.databind.annotation.JsonSerialize` | `tools.jackson.databind.annotation.JsonSerialize` |
| `new ObjectMapper()` | `JsonMapper.builder().build()` |
| `throws IOException` | `throws JacksonException` |

Core *annotations* (`com.fasterxml.jackson.annotation`, v2.21) keep their old package,
which makes the split easy to misread.

### 2. Autoconfiguration is modularised

Boot 4 splits autoconfiguration into per-technology modules —
`spring-boot-hibernate`, `spring-boot-jackson`, `spring-boot-jdbc`, and so on.

**A library on the classpath is inert without its Boot module.** `flyway-core` was
present and correctly configured, and Flyway simply never ran; the schema stayed empty
and Hibernate failed validation with "missing table". The fix was adding
`org.springframework.boot:spring-boot-flyway`.

**Rule:** when adding any integration, add its `spring-boot-*` module too.

### 3. Starter names changed

`spring-boot-starter-web` is now `spring-boot-starter-webmvc`, and the single
`spring-boot-starter-test` is replaced by per-slice test starters
(`spring-boot-starter-webmvc-test`, `spring-boot-starter-data-jpa-test`, …).

### 4. Built-in ProblemDetails advice wins ordering

With `spring.mvc.problemdetails.enabled=true`, Spring registers its own
`@ControllerAdvice`. Ordering against ours was undefined and the built-in one won,
stripping our `code`, `field` and per-field `errors` from validation failures —
the response degraded to `"Invalid request content."`.

**Fix:** `spring.mvc.problemdetails.enabled=false` plus
`@Order(Ordered.HIGHEST_PRECEDENCE)` on `GlobalExceptionHandler`. We produce a richer
RFC 7807 document ourselves; explicit precedence means this can never silently regress.

## Consequences

**Good.** Current framework, Java 21, Hibernate 7, and Jackson 3's cleaner API.

**Cost.** Most Boot documentation and every AI-suggested snippet currently targets
Boot 3. Expect `com.fasterxml.jackson` imports and missing `spring-boot-*` modules to
be the two recurring sources of confusion.

**Also removed:** `springdoc-openapi` is deferred — only Boot 3-targeting versions
(2.5.0, 2.8.3) are available, and Spring Framework 7 compatibility is unverified. The
Postman collection is the API documentation for now.
