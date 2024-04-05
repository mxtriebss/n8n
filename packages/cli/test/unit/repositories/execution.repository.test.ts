import Container from 'typedi';
import { Not, LessThanOrEqual } from '@n8n/typeorm';

import config from '@/config';
import { ExecutionEntity } from '@db/entities/ExecutionEntity';
import { ExecutionRepository } from '@db/repositories/execution.repository';

import { mockEntityManager } from '../../shared/mocking';

describe('ExecutionRepository', () => {
	const entityManager = mockEntityManager(ExecutionEntity);
	const executionRepository = Container.get(ExecutionRepository);
	const mockDate = new Date('2023-12-28 12:34:56.789Z');

	beforeAll(() => {
		jest.clearAllMocks();
		jest.useFakeTimers().setSystemTime(mockDate);
	});

	afterAll(() => jest.useRealTimers());

	describe('getWaitingExecutions()', () => {
		test.each(['sqlite', 'postgres'])(
			'on %s, should be called with expected args',
			async (dbType) => {
				jest.spyOn(config, 'getEnv').mockReturnValueOnce(dbType);
				entityManager.find.mockResolvedValueOnce([]);

				await executionRepository.getWaitingExecutions();

				expect(entityManager.find).toHaveBeenCalledWith(ExecutionEntity, {
					order: { waitTill: 'ASC' },
					select: ['id', 'waitTill'],
					where: {
						status: Not('crashed'),
						waitTill: LessThanOrEqual(
							dbType === 'sqlite'
								? '2023-12-28 12:36:06.789'
								: new Date('2023-12-28T12:36:06.789Z'),
						),
					},
				});
			},
		);
	});
});
