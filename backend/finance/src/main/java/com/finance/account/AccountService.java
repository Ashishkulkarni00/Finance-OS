package com.finance.account;

import com.finance.account.domain.Account;
import com.finance.account.dto.CreateAccountRequest;
import com.finance.account.dto.UpdateAccountRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Account use cases.
 *
 * <p>An interface so controllers depend on behaviour rather than implementation, and
 * so other features can be given a narrow view of accounts without reaching into the
 * repository.
 */
public interface AccountService {

    Account create(CreateAccountRequest request);

    Account getById(Long id);

    /**
     * Resolves an account by id even if archived or soft-deleted, for displaying a
     * historical reference (e.g. on a transaction). Never use this to authorise a
     * mutation - {@link #getById(Long)} is the guarded lookup for that.
     */
    Account getByIdIncludingDeleted(Long id);

    Page<Account> list(boolean includeArchived, Pageable pageable);

    List<Account> listActive();

    Account update(Long id, UpdateAccountRequest request);

    Account archive(Long id);

    Account unarchive(Long id);

    void delete(Long id);
}
