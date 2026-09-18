-- ---------------------------------------------------------------------------
-- V6 : goals
--
-- Milestone 10. Progress is never stored - GoalServiceImpl reads it from whichever
-- of linked_reservation_id/linked_account_id is set, at query time.
--
-- Also adds the foreign key on reservations.goal_id that V3 deliberately left off,
-- since Goal did not exist yet - see the comment in V3__reservations_cycles_commitments.sql.
-- ---------------------------------------------------------------------------

CREATE TABLE goals (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT        NOT NULL,
    name                        VARCHAR(100)  NOT NULL,
    target_amount               DECIMAL(15,2) NOT NULL,
    target_date                 DATE          NOT NULL,
    priority                    INT           NOT NULL DEFAULT 0,

    -- At most one of these two is set - a goal tracks a reservation or an account,
    -- never both. Enforced in the service, not the schema (a CHECK across two
    -- nullable columns needing "at most one non-null" is awkward in MySQL and not
    -- worth the awkwardness for a single-user app).
    linked_reservation_id       BIGINT        NULL,
    linked_account_id           BIGINT        NULL,

    archived_at                 DATETIME(6)   NULL,

    created_at                  DATETIME(6)   NOT NULL,
    updated_at                  DATETIME(6)   NOT NULL,
    deleted_at                  DATETIME(6)   NULL,
    version                     BIGINT        NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_goals_reservation FOREIGN KEY (linked_reservation_id) REFERENCES reservations (id),
    CONSTRAINT fk_goals_account FOREIGN KEY (linked_account_id) REFERENCES accounts (id),

    CONSTRAINT ck_goals_target_amount CHECK (target_amount > 0),

    KEY ix_goals_user_active (user_id, deleted_at, archived_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;


ALTER TABLE reservations
    ADD CONSTRAINT fk_reservations_goal FOREIGN KEY (goal_id) REFERENCES goals (id);
