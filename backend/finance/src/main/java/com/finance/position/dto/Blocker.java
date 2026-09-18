package com.finance.position.dto;

/**
 * One reason Real Balance cannot be computed right now, with a route to fix it.
 * See ADR-0006 and {@code BACKEND_CONVENTIONS.md} §5 - "we don't know yet" is a 200,
 * never an error, but the number must not be guessed either.
 */
public record Blocker(String commitmentInstanceId, String name, String fix) {
}
