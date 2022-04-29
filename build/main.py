"""Produces the artifacts for the project."""
import os
from jsmin import jsmin


def main():
    os.makedirs('../out', exist_ok=True)
    for (file, typehints) in [('../out/rl.js', True),  ('../out/rl.stripped.js', False)]:
        with open(file, 'w') as f_out:
            with open('../LICENSE', 'r') as f_in:
                print('/**', file=f_out)
                for line in f_in:
                    print(f' * {line.strip()}', file=f_out)
                print(' */\n', file=f_out)

            with open('../src/observable.js', 'r') as f_in:
                for line in f_in:
                    f_out.write(line)

            with open('../src/replica_listener.js', 'r') as f_in:
                for idx, line in enumerate(f_in):
                    if idx > 0 and (typehints or not line.strip().endswith('@@type-hints')):
                        f_out.write(line)

    with open('../out/rl.js.min', 'w') as f_out:
        with open('../out/rl.js', 'r') as f_in:
            f_out.write(jsmin(f_in.read()))


if __name__ == "__main__":
    main()
