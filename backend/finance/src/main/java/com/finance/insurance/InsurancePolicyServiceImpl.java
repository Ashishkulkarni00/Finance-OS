package com.finance.insurance;

import com.finance.common.exception.BusinessRuleException;
import com.finance.common.exception.ErrorCode;
import com.finance.common.exception.ResourceNotFoundException;
import com.finance.common.money.MoneyScale;
import com.finance.common.user.CurrentUserProvider;
import com.finance.commitment.CommitmentRepository;
import com.finance.commitment.domain.Commitment;
import com.finance.commitment.domain.CommitmentSource;
import com.finance.insurance.domain.InsurancePolicy;
import com.finance.insurance.dto.CreateInsurancePolicyRequest;
import com.finance.insurance.dto.UpdateInsurancePolicyRequest;
import com.finance.loan.LoanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Business rules for insurance policies - the protection primitive (ROADMAP 1.3).
 *
 * <p>Nothing here is stored that can be derived: monthly cost, cover status and days to
 * renewal are all computed on read (ADR-0011).
 */
@Service
public class InsurancePolicyServiceImpl implements InsurancePolicyService {

    private static final Logger log = LoggerFactory.getLogger(InsurancePolicyServiceImpl.class);

    /** How far ahead a renewal counts as "soon". A month is enough notice to find the money
     *  for an annual premium, which is the whole point of naming the date. */
    static final int RENEWAL_WINDOW_DAYS = 30;

    private final InsurancePolicyRepository repository;
    private final CommitmentRepository commitmentRepository;
    private final LoanRepository loanRepository;
    private final CurrentUserProvider currentUser;
    private final Clock clock;

    public InsurancePolicyServiceImpl(InsurancePolicyRepository repository,
                                      CommitmentRepository commitmentRepository,
                                      LoanRepository loanRepository,
                                      CurrentUserProvider currentUser,
                                      Clock clock) {
        this.repository = repository;
        this.commitmentRepository = commitmentRepository;
        this.loanRepository = loanRepository;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    @Override
    @Transactional
    public InsurancePolicyView create(CreateInsurancePolicyRequest request) {
        Long userId = currentUser.currentUserId();
        requireLoanOwned(request.loanId(), userId);

        InsurancePolicy policy = InsurancePolicy.builder()
                .userId(userId)
                .type(request.type())
                .name(request.name().trim())
                .insurer(trimToNull(request.insurer()))
                .policyLastFour(trimToNull(request.policyLastFour()))
                .coverAmount(MoneyScale.normalise(request.coverAmount()))
                .premium(MoneyScale.normalise(request.premium()))
                .premiumFrequency(request.premiumFrequency())
                .renewsOn(request.renewsOn())
                .startedOn(request.startedOn())
                .covers(trimToNull(request.covers()))
                .note(trimToNull(request.note()))
                .loanId(request.loanId())
                .build();

        InsurancePolicy saved = repository.save(policy);
        // No cover amount, no insurer, no name - ADR-0010.
        log.info("Insurance policy created id={} type={}", saved.getId(), saved.getType());
        return toView(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InsurancePolicyView getById(Long id) {
        return toView(requireOwned(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InsurancePolicyView> list(boolean includeArchived, Pageable pageable) {
        return repository.findAllForUser(currentUser.currentUserId(), includeArchived, pageable).map(this::toView);
    }

    @Override
    @Transactional
    public InsurancePolicyView update(Long id, UpdateInsurancePolicyRequest request) {
        InsurancePolicy policy = requireOwned(id);

        if (request.type() != null) {
            policy.setType(request.type());
        }
        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty()) {
                throw new BusinessRuleException(ErrorCode.VALIDATION_FAILED,
                        "A policy needs a name you'll recognise.", "name");
            }
            policy.setName(name);
        }
        if (request.insurer() != null) {
            policy.setInsurer(trimToNull(request.insurer()));
        }
        if (request.policyLastFour() != null) {
            policy.setPolicyLastFour(trimToNull(request.policyLastFour()));
        }
        if (request.coverAmount() != null) {
            policy.setCoverAmount(MoneyScale.normalise(request.coverAmount()));
        }
        if (request.premium() != null) {
            policy.setPremium(MoneyScale.normalise(request.premium()));
        }
        if (request.premiumFrequency() != null) {
            policy.setPremiumFrequency(request.premiumFrequency());
        }
        if (Boolean.TRUE.equals(request.clearRenewsOn())) {
            policy.setRenewsOn(null);
        } else if (request.renewsOn() != null) {
            policy.setRenewsOn(request.renewsOn());
        }
        if (request.startedOn() != null) {
            policy.setStartedOn(request.startedOn());
        }
        if (request.covers() != null) {
            policy.setCovers(trimToNull(request.covers()));
        }
        if (request.note() != null) {
            policy.setNote(trimToNull(request.note()));
        }
        if (Boolean.TRUE.equals(request.clearLoan())) {
            policy.setLoanId(null);
        } else if (request.loanId() != null) {
            requireLoanOwned(request.loanId(), policy.getUserId());
            policy.setLoanId(request.loanId());
        }

        InsurancePolicy saved = repository.save(policy);
        log.info("Insurance policy updated id={}", saved.getId());
        return toView(saved);
    }

    @Override
    @Transactional
    public InsurancePolicyView archive(Long id) {
        InsurancePolicy policy = requireOwned(id);
        if (!policy.isArchived()) {
            policy.archive();
            repository.save(policy);
            log.info("Insurance policy archived id={}", id);
        }
        return toView(policy);
    }

    @Override
    @Transactional
    public InsurancePolicyView unarchive(Long id) {
        InsurancePolicy policy = requireOwned(id);
        if (policy.isArchived()) {
            policy.unarchive();
            repository.save(policy);
            log.info("Insurance policy unarchived id={}", id);
        }
        return toView(policy);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        InsurancePolicy policy = requireOwned(id);
        policy.markDeleted();
        repository.save(policy);
        log.info("Insurance policy soft-deleted id={}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public InsuranceSummary summary() {
        List<InsurancePolicy> policies = repository.findByUserIdAndDeletedAtIsNull(currentUser.currentUserId())
                .stream().filter(p -> !p.isArchived()).toList();

        BigDecimal cover = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;
        boolean premiumComplete = true;
        int lapsed = 0, soon = 0, unknown = 0;

        for (InsurancePolicy policy : policies) {
            if (policy.getCoverAmount() != null) {
                cover = cover.add(policy.getCoverAmount());
            }
            BigDecimal cost = policy.monthlyCost();
            if (cost == null) {
                // One unknown premium makes the total unknown - a figure quietly missing a
                // policy would read as the full cost of being covered (ADR-0006).
                premiumComplete = false;
            } else {
                monthly = monthly.add(cost);
            }
            switch (statusOf(policy, LocalDate.now(clock))) {
                case LAPSED -> lapsed++;
                case RENEWS_SOON -> soon++;
                case UNKNOWN -> unknown++;
                case ACTIVE -> {
                    // Nothing to count.
                }
            }
        }

        return new InsuranceSummary(policies.size(), MoneyScale.normalise(cover),
                premiumComplete ? MoneyScale.normalise(monthly) : null, lapsed, soon, unknown);
    }

    private InsurancePolicyView toView(InsurancePolicy policy) {
        LocalDate today = LocalDate.now(clock);
        Integer days = policy.getRenewsOn() == null
                ? null : (int) ChronoUnit.DAYS.between(today, policy.getRenewsOn());

        Long premiumCommitmentId = commitmentRepository.findBySourceTypeAndSourceIdAndUserIdAndDeletedAtIsNull(
                        CommitmentSource.INSURANCE, policy.getId(), policy.getUserId()).stream()
                .map(Commitment::getId).findFirst().orElse(null);

        return new InsurancePolicyView(policy, policy.monthlyCost(), statusOf(policy, today), days, premiumCommitmentId);
    }

    static CoverStatus statusOf(InsurancePolicy policy, LocalDate today) {
        if (policy.getRenewsOn() == null) {
            return CoverStatus.UNKNOWN;
        }
        if (policy.getRenewsOn().isBefore(today)) {
            return CoverStatus.LAPSED;
        }
        return ChronoUnit.DAYS.between(today, policy.getRenewsOn()) <= RENEWAL_WINDOW_DAYS
                ? CoverStatus.RENEWS_SOON : CoverStatus.ACTIVE;
    }

    /** Another user's loan is a 404, never a 403 (ADR-0005). */
    private void requireLoanOwned(Long loanId, Long userId) {
        if (loanId == null) {
            return;
        }
        loanRepository.findByIdAndUserIdAndDeletedAtIsNull(loanId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "We couldn't find that loan.", "loanId"));
    }

    private InsurancePolicy requireOwned(Long id) {
        return repository.findByIdAndUserIdAndDeletedAtIsNull(id, currentUser.currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "We couldn't find that policy. It may have been deleted."));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
