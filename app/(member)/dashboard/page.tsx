            role="status"
            className="mb-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-400"
          >
            {success}
          </p>
        )}

        {missions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Noch keine Missionen"
            text="Falls nichts erscheint, lade die Seite neu."
          />
        ) : (
          <ul className="grid gap-3">
            {missions.map((m) => (
              <MissionCard
                key={m.id}
                m={m}
                busy={busy === m.id}
                onComplete={openUpload}
              />
            ))}
          </ul>
        )}
      </section>

      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-proof-title"
            className="card w-full max-w-md space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="dashboard-proof-title"
                  className="font-display text-2xl font-semibold"
                >
                  Mission nachweisen
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {selectedMission.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeUpload}
                disabled={Boolean(busy)}
                aria-label="Schließen"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-white/80">
              Lade ein Foto oder einen Screenshot hoch,
              der zeigt, dass du die Mission erledigt hast.
              Nach der Adminprüfung erhältst du deine XP.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setMsg("");
              }}
            />

            <button
              type="button"
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/30 p-6 text-center"
              onClick={() => inputRef.current?.click()}
              disabled={Boolean(busy)}
            >
              <ImagePlus className="h-9 w-9 text-accent" />

              <span className="text-sm font-semibold">
                {file
                  ? file.name
                  : "Foto oder Screenshot auswählen"}
              </span>

              <span className="text-xs text-muted">
                JPG, PNG oder WEBP · Maximal 10 MB
              </span>
            </button>

            {msg && (
              <p role="alert" className="text-sm text-red-400">
                {msg}
              </p>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={!file || Boolean(busy)}
              onClick={() => void submitProof()}
            >
              {busy
                ? "Nachweis wird hochgeladen..."
                : "Nachweis zur Prüfung einreichen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
