import {
  ArrowLeft,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, Input, SectionTitle, Textarea } from '../components/ui'
import { useDecks } from '../hooks/useDecks'
import type { Deck } from '../lib/types'

type View = { mode: 'list' } | { mode: 'manage'; deckId: string } | { mode: 'review'; deckId: string }

function dueCards(deck: Deck) {
  const now = new Date()
  return deck.cards.filter((c) => new Date(c.dueDate) <= now)
}

export default function Lernen() {
  const { decks, addDeck, removeDeck, addCard, removeCard, gradeCard } =
    useDecks()
  const [view, setView] = useState<View>({ mode: 'list' })
  const [newDeckName, setNewDeckName] = useState('')

  if (view.mode === 'manage') {
    const deck = decks.find((d) => d.id === view.deckId)
    if (!deck) return null
    return (
      <ManageDeck
        deck={deck}
        onBack={() => setView({ mode: 'list' })}
        onAddCard={(front, back) => addCard(deck.id, front, back)}
        onRemoveCard={(cardId) => removeCard(deck.id, cardId)}
      />
    )
  }

  if (view.mode === 'review') {
    const deck = decks.find((d) => d.id === view.deckId)
    if (!deck) return null
    return (
      <ReviewDeck
        deck={deck}
        onBack={() => setView({ mode: 'list' })}
        onGrade={(cardId, grade) => gradeCard(deck.id, cardId, grade)}
      />
    )
  }

  const handleAddDeck = () => {
    if (!newDeckName.trim()) return
    addDeck(newDeckName.trim())
    setNewDeckName('')
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Lernen"
        subtitle="Karteikarten mit Wiederholung nach Lernfortschritt"
      />

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Neues Deck, z.B. Vokabeln Englisch"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDeck()}
          />
          <Button variant="primary" onClick={handleAddDeck}>
            <Plus size={16} />
            Deck
          </Button>
        </div>
      </Card>

      {decks.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={20} />}
          title="Noch keine Decks"
          description="Leg ein Deck an und füge Karteikarten hinzu, um loszulegen."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {decks.map((deck) => {
            const due = dueCards(deck).length
            return (
              <Card key={deck.id} className="p-4 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: deck.color }}
                  />
                  <h3 className="font-semibold m-0 truncate">{deck.name}</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  {deck.cards.length} Karten · {due} fällig
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    disabled={due === 0}
                    onClick={() => setView({ mode: 'review', deckId: deck.id })}
                    className="flex-1"
                  >
                    Lernen
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setView({ mode: 'manage', deckId: deck.id })}
                  >
                    <Layers size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => removeDeck(deck.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ManageDeck({
  deck,
  onBack,
  onAddCard,
  onRemoveCard,
}: {
  deck: Deck
  onBack: () => void
  onAddCard: (front: string, back: string) => void
  onRemoveCard: (cardId: string) => void
}) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const handleAdd = () => {
    if (!front.trim() || !back.trim()) return
    onAddCard(front.trim(), back.trim())
    setFront('')
    setBack('')
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>
      <SectionTitle title={deck.name} subtitle="Karten verwalten" />

      <Card className="p-4 space-y-3">
        <Textarea
          placeholder="Vorderseite (Frage)"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={2}
        />
        <Textarea
          placeholder="Rückseite (Antwort)"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={2}
        />
        <Button variant="primary" onClick={handleAdd}>
          <Plus size={16} />
          Karte hinzufügen
        </Button>
      </Card>

      {deck.cards.length === 0 ? (
        <EmptyState title="Noch keine Karten in diesem Deck" />
      ) : (
        <ul className="space-y-2">
          {deck.cards.map((c) => (
            <li key={c.id}>
              <Card className="p-3.5 flex items-start justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.front}</p>
                  <p className="text-sm text-[var(--text-muted)] truncate">
                    {c.back}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveCard(c.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] shrink-0"
                  aria-label="Karte löschen"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewDeck({
  deck,
  onBack,
  onGrade,
}: {
  deck: Deck
  onBack: () => void
  onGrade: (cardId: string, grade: 0 | 1 | 2 | 3) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const due = useMemo(() => dueCards(deck), [deck])
  const current = due[0]

  if (!current) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={16} />
          Zurück
        </button>
        <EmptyState
          icon={<Sparkles size={20} />}
          title="Alles gelernt!"
          description="Für heute sind keine Karten mehr fällig."
        />
      </div>
    )
  }

  const handleGrade = (grade: 0 | 1 | 2 | 3) => {
    onGrade(current.id, grade)
    setFlipped(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={16} />
          Zurück
        </button>
        <span className="text-sm text-[var(--text-muted)]">
          {due.length} verbleibend
        </span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full"
      >
        <Card className="p-10 min-h-56 flex items-center justify-center text-center">
          <p className="text-lg font-medium">
            {flipped ? current.back : current.front}
          </p>
        </Card>
      </button>

      {!flipped ? (
        <Button
          variant="primary"
          onClick={() => setFlipped(true)}
          className="w-full"
        >
          Antwort zeigen
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <Button variant="danger" onClick={() => handleGrade(0)}>
            <RotateCcw size={14} />
            Nochmal
          </Button>
          <Button variant="secondary" onClick={() => handleGrade(1)}>
            Schwer
          </Button>
          <Button variant="secondary" onClick={() => handleGrade(2)}>
            Gut
          </Button>
          <Button variant="primary" onClick={() => handleGrade(3)}>
            Einfach
          </Button>
        </div>
      )}
    </div>
  )
}
