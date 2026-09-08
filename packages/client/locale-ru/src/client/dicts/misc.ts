/** Russian copy for remaining smaller UI namespaces. */
export const planRu: Record<string, string> = {
  'chip.label': 'План',
  'chip.on.aria': 'Режим плана включён, нажмите чтобы выключить',
  'chip.on.title': 'Режим плана включён — нажмите, чтобы выключить (/plan off)',
  'chip.off.aria': 'Режим плана выключен, нажмите чтобы включить',
  'chip.off.title': 'Режим плана выключен — нажмите, чтобы включить (/plan)',
  'chip.exitFailed': 'Не удалось выйти из режима плана',
}

export const goalRu: Record<string, string> = {
  'phase.active': 'Текущая цель',
  'phase.paused': 'Цель на паузе',
  'phase.blocked': 'Цель заблокирована',
  'objective.aria': 'Формулировка цели',
  'commandInput.aria': 'Ввод команды',
  'action.save': 'Сохранить цель',
  'action.cancel': 'Отменить правку',
  'action.pause': 'Приостановить цель',
  'action.resume': 'Возобновить цель',
  'action.edit': 'Изменить цель',
  'action.clear': 'Очистить цель',
}

export const questionRu: Record<string, string> = {
  'error.incomplete': 'Сначала завершите этот вопрос.',
  'error.unanswered': 'Выберите вариант или введите свой ответ.',
  'nav.prev': 'Предыдущий вопрос',
  'nav.next': 'Следующий вопрос',
  'nav.minimize': 'Свернуть карточку вопросов',
  'nav.maximize': 'Развернуть карточку вопросов',
  'nav.cancel': 'Отклонить все вопросы',
  'option.recommended': 'Рекомендуется',
  'custom.placeholder': 'Введите ответ',
  'action.skip': 'Пропустить этот вопрос',
  'action.next': 'Далее',
  'plan.header': 'Проверка плана',
  'plan.approve': 'Утвердить',
  'plan.decline': 'Отклонить',
  'plan.discuss': 'Обсудить в чате',
}

export const feedbackRu: Record<string, string> = {
  'action.like': 'Хороший ответ',
  'action.likeActive': 'Снять оценку',
  'action.dislike': 'Плохой ответ',
  'action.dislikeActive': 'Снять оценку',
  'note.open': 'Добавить заметку',
  'note.dialog': 'Отзыв',
  'note.placeholder': 'Что было хорошо или что пошло не так? (необязательно)',
  'note.save': 'Сохранить',
  'note.cancel': 'Отмена',
  'note.aria': 'Заметка к отзыву',
  'error.conflict': 'Этот отзыв изменили в другом месте; показано актуальное состояние',
  'error.load': 'Не удалось загрузить отзыв',
  'error.generic': 'Не удалось сохранить отзыв',
}

export const jobRu: Record<string, string> = {
  'count.live.one': 'Выполняется {count} фоновая задача',
  'count.live.other': 'Выполняется {count} фоновых задач',
  'count.idle.one': '{count} фоновая задача',
  'count.idle.other': '{count} фоновых задач',
  'list.aria': 'Фоновые задачи',
  'status.running': 'выполняется',
  'status.stopping': 'останавливается',
  'status.completed': 'завершена',
  'status.killed': 'отменена',
  'status.failed': 'ошибка',
  'duration.seconds': '{seconds} с',
  'duration.minutes': '{minutes} мин {seconds} с',
  'duration.hours': '{hours} ч {minutes} мин',
  'duration.title.live': 'Идёт {duration}',
  'duration.title.done': 'Заняло {duration}',
}

export const skillRu: Record<string, string> = {
  'row.title': 'Навык',
  'row.running': 'Загрузка навыка',
  'row.failed': 'Не удалось загрузить навык',
  'row.stopped': 'Загрузка навыка остановлена',
  'row.instructions': 'Инструкции',
  'row.inspect': 'Просмотр',
  'menu.userOnly': 'только пользователь',
}

export const referenceRu: Record<string, string> = {
  'section.files': 'Файлы и папки',
  'section.sessions': 'Сеансы',
  'candidate.noCwd': '(нет рабочей папки)',
  'crumb.root': 'Рабочая область',
  'time.now': 'только что',
  'time.minutes': '{n} мин',
  'time.hours': '{n} ч',
  'time.days': '{n} д',
  'time.months': '{n} мес',
  'time.years': '{n} г',
}

export const deliverablesRu: Record<string, string> = {
  'produced.label': 'Результаты',
  'produced.moreOne': '+ 1 файл',
  'produced.more': '+ {count} файлов',
  'produced.open': 'Открыть {name}',
  'produced.showInFolder': 'Показать в папке',
}

export const workflowRunRu: Record<string, string> = {
  'run.title': '{name}',
  'run.members.one': '{count} участник',
  'run.members.other': '{count} участников',
  'run.empty': 'Участники не запускались',
  'phase.unassigned': 'Без этапа',
  'phase.empty': 'Пустое имя этапа',
  'statusCount.running': 'Выполняется {count}',
  'statusCount.completed': 'Завершено {count}',
  'statusCount.failed': 'Ошибка {count}',
  'statusCount.cancelled': 'Отменено {count}',
  'statusCount.interrupted': 'Прервано {count}',
  'member.empty': 'Пустое имя участника',
  'member.open': 'Открыть {name}',
  'status.running': 'Выполняется',
  'status.completed': 'Завершено',
  'status.failed': 'Ошибка',
  'status.cancelled': 'Отменено',
  'status.interrupted': 'Прервано',
}
