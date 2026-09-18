package com.finance.timeline;

import java.util.List;

/** Every dated obligation ahead, most urgent first. See {@code INFORMATION_ARCHITECTURE.md} §3 "Today · Coming up". */
public interface TimelineService {

    List<TimelineItem> upcoming(int days);
}
