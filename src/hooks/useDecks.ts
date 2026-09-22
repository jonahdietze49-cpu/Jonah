import { newId, useStoredState } from '../lib/storage'
import type { Deck, Flashcard } from '../lib/types'

const DECK_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#0891b2',
  '#16a34a',
  '#d97706',
  '#e11d48',
]

export function pickDeckColor(existing: Deck[]) {
  return DECK_COLORS[existing.length % DECK_COLORS.length]
}

/** Grade 0 = nochmal, 1 = schwer, 2 = gut, 3 = einfach */
export function reviewCard(card: Flashcard, grade: 0 | 1 | 2 | 3): Flashcard {
  let { interval, ease } = card
  if (grade === 0) {
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
  } else {
    ease = Math.max(1.3, ease + (grade - 2) * 0.15)
    interval = interval === 0 ? 1 : Math.round(interval * ease)
  }
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (interval === 0 ? 0 : interval))
  if (interval === 0) dueDate.setMinutes(dueDate.getMinutes() + 10)
  return {
    ...card,
    interval,
    ease,
    dueDate: dueDate.toISOString(),
    reviews: card.reviews + 1,
  }
}

export function useDecks() {
  const [decks, setDecks] = useStoredState<Deck[]>('decks', [])

  const addDeck = (name: string): Deck => {
    const deck: Deck = {
      id: newId(),
      name,
      color: pickDeckColor(decks),
      cards: [],
      createdAt: new Date().toISOString(),
    }
    setDecks((prev) => [...prev, deck])
    return deck
  }

  const removeDeck = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id))
  }

  const addCard = (deckId: string, front: string, back: string) => {
    const card: Flashcard = {
      id: newId(),
      front,
      back,
      interval: 0,
      ease: 2.5,
      dueDate: new Date().toISOString(),
      reviews: 0,
    }
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, cards: [...d.cards, card] } : d,
      ),
    )
  }

  const removeCard = (deckId: string, cardId: string) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) }
          : d,
      ),
    )
  }

  const gradeCard = (deckId: string, cardId: string, grade: 0 | 1 | 2 | 3) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId ? reviewCard(c, grade) : c,
              ),
            }
          : d,
      ),
    )
  }

  return { decks, addDeck, removeDeck, addCard, removeCard, gradeCard }
}
