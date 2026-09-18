package com.finance.account.dto;

import com.finance.account.domain.AccountType;

/** A nested reference to an account - never the full entity, never the full response. */
public record AccountSummary(Long id, String name, AccountType type) {
}
