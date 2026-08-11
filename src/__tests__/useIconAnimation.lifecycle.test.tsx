import { act, renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useIconAnimation } from '../animated';

/**
 * The animation hook was covered by shape assertions — which preset produces
 * which style — and not at all by what it does over time. Everything that can
 * actually leak lives in the second category: a delay that outlives the
 * component, an animation nobody stops, a callback fired after unmount.
 */
describe('useIconAnimation over time', () => {
  /** A rotate that returns a bare timing, so the spy below sees it directly. */
  const ROTATE = { type: 'rotate', from: 0, to: 360, loop: false } as const;

  let started: Array<(result: { finished: boolean }) => void>;
  let stopped: number;
  let timing: jest.SpyInstance;

  beforeEach(() => {
    // The delay is a timer and is what these tests drive; the hook's state
    // updates go through queueMicrotask, which must stay real or nothing ever
    // settles.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    started = [];
    stopped = 0;
    // React Native's timing driver does not run under fake timers, and the
    // logic under test is the wiring around it rather than the interpolation.
    timing = jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) => {
            if (callback) started.push(callback);
          },
          stop: () => {
            stopped += 1;
          },
          reset: () => undefined,
        }) as unknown as Animated.CompositeAnimation
    );
  });

  afterEach(() => {
    timing.mockRestore();
    jest.useRealTimers();
  });

  const finishAll = async () => {
    await act(async () => {
      started.forEach((callback) => callback({ finished: true }));
    });
  };

  it('starts on mount when asked to', () => {
    renderHook(() => useIconAnimation({ animation: ROTATE }));

    expect(timing).toHaveBeenCalled();
  });

  it('stays still until told to start', () => {
    renderHook(() => useIconAnimation({ animation: ROTATE, autoPlay: false }));

    expect(timing).not.toHaveBeenCalled();
  });

  it('reports itself running once started', async () => {
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE }));

    await act(async () => undefined);

    expect(result.current.state).toBe('running');
    expect(result.current.isAnimating).toBe(true);
  });

  it('calls back when the animation finishes', async () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE, onComplete }));

    await finishAll();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe('completed');
  });

  // An animation that was stopped did not complete, and treating it as though
  // it did would fire onComplete for something the user interrupted.
  it('does not call back when the animation was interrupted', async () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE, onComplete }));

    await act(async () => {
      started.forEach((callback) => callback({ finished: false }));
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
  });

  it('stops on request', async () => {
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE }));

    await act(async () => {
      result.current.stop();
    });

    expect(stopped).toBeGreaterThan(0);
    expect(result.current.state).toBe('idle');
  });

  it('reports itself paused', async () => {
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE }));

    await act(async () => {
      result.current.pause();
    });

    expect(result.current.state).toBe('paused');
  });

  it('resumes only from paused', async () => {
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE }));
    await act(async () => undefined);
    timing.mockClear();

    await act(async () => {
      result.current.resume();
    });
    expect(timing).not.toHaveBeenCalled();

    await act(async () => {
      result.current.pause();
    });
    await act(async () => {
      result.current.resume();
    });
    expect(timing).toHaveBeenCalled();
  });

  it('returns to idle when reset', async () => {
    const { result } = renderHook(() => useIconAnimation({ animation: ROTATE }));

    await finishAll();
    expect(result.current.state).toBe('completed');

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
  });

  describe('with a delay', () => {
    const DELAYED = { ...ROTATE, delay: 500 } as const;

    /**
     * `delay` written on the animation was discarded, because the hook
     * destructured its own `delay` option with a default of 0 and passed that
     * as an override — and an override of 0 is still an override.
     */
    it('waits before starting', () => {
      renderHook(() => useIconAnimation({ animation: DELAYED }));

      expect(timing).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(timing).toHaveBeenCalled();
    });

    it('lets the hook option override the animation', () => {
      renderHook(() => useIconAnimation({ animation: DELAYED, delay: 0 }));

      expect(timing).toHaveBeenCalled();
    });

    /**
     * The regression: the pending delay was never cleared. Unmount ran the
     * cleanup — which stops an animation that has not been created yet — and
     * the timer then fired and created one. Nothing held a reference to it, so
     * a looping animation ran for the rest of the process's life.
     */
    it('does not start after the component is gone', () => {
      const { unmount } = renderHook(() => useIconAnimation({ animation: DELAYED }));

      unmount();
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(timing).not.toHaveBeenCalled();
    });

    it('does not start after being stopped', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: DELAYED }));

      act(() => {
        result.current.stop();
        jest.advanceTimersByTime(1000);
      });

      expect(timing).not.toHaveBeenCalled();
    });

    it('does not start after being paused', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: DELAYED }));

      act(() => {
        result.current.pause();
        jest.advanceTimersByTime(1000);
      });

      expect(timing).not.toHaveBeenCalled();
    });
  });

  describe('without an animation', () => {
    it('does nothing and says so', async () => {
      const { result } = renderHook(() => useIconAnimation());

      expect(result.current.hasAnimation).toBe(false);
      expect(result.current.animatedStyle).toEqual({});

      await act(async () => {
        result.current.start();
      });

      expect(timing).not.toHaveBeenCalled();
      expect(result.current.state).toBe('idle');
    });
  });
});
