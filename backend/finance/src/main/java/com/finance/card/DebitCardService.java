package com.finance.card;

import com.finance.card.dto.CreateDebitCardRequest;
import com.finance.card.dto.UpdateDebitCardRequest;

import java.util.List;

public interface DebitCardService {

    DebitCardView create(CreateDebitCardRequest request);

    List<DebitCardView> list();

    DebitCardView update(Long id, UpdateDebitCardRequest request);

    void delete(Long id);
}
