import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// The phone runs the suite slowly in parallel; the default 1 s wait for findBy* is too tight.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => cleanup());
